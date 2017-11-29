/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as adal from 'adal-node';
import * as data from 'data';
import * as request from 'request';
import * as nls from 'vscode-nls';
import {
	Arguments,
	AzureAccount,
	AzureAccountProviderMetadata,
	AzureAccountSecurityTokenCollection,
	Tenant
} from './interfaces';
import TokenCache from './tokenCache';

const localize = nls.loadMessageBundle();

export class AzureAccountProvider implements data.AccountProvider {
	// CONSTANTS ///////////////////////////////////////////////////////////
	private static WorkSchoolAccountLogo: data.AccountContextualLogo = {
		light: AzureAccountProvider.loadIcon('work_school_account_light.svg'),
		dark: AzureAccountProvider.loadIcon('work_school_account_dark.svg')
	};
	private static MicrosoftAccountLogo: data.AccountContextualLogo = {
		light: AzureAccountProvider.loadIcon('microsoft_account_light.svg'),
		dark: AzureAccountProvider.loadIcon('microsoft_account_dark.svg')
	};
	private static AadCommonTenant: string = 'common';

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _args: Arguments;
	private _commonAuthorityUrl: string;
	private _isInitialized: boolean;

	constructor(private _metadata: AzureAccountProviderMetadata, private _tokenCache: TokenCache) {
		this._args = {
			host: this._metadata.settings.host,
			clientId: this._metadata.settings.clientId
		};
		this._isInitialized = false;

		this._commonAuthorityUrl = `${this._metadata.settings.host}/common`;
	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	/**
	 * Clears all tokens that belong to the given account from the token cache
	 * @param {"data".AccountKey} accountKey Key identifying the account to delete tokens for
	 * @returns {Thenable<void>} Promise to clear requested tokens from the token cache
	 */
	public clear(accountKey: data.AccountKey): Thenable<void> {
		let self = this;

		// Put together a query to look up any tokens associated with the account key
		let query = <adal.TokenResponse>{ userId: accountKey.accountId };

		// 1) Look up the tokens associated with the query
		// 2) Remove them
		return this._tokenCache.findThenable(query)
			.then(results => { return self._tokenCache.removeThenable(results); });
	}

	/**
	 * Clears the entire token cache. Invoked by command palette action.
	 * @returns {Thenable<void>} Promise to clear the token cache
	 */
	public clearTokenCache(): Thenable<void> {
		return this._tokenCache.clear();
	}

	public getSecurityToken(account: AzureAccount): Thenable<AzureAccountSecurityTokenCollection> {
		let self = this;
		return this.doIfInitialized(() => self.getAccessTokens(account));
	}

	public initialize(restoredAccounts: data.Account[]): Thenable<data.Account[]> {
		let self = this;

		return new Promise<data.Account[]>(resolve => {
			// Rehydrate the accounts
			restoredAccounts.forEach((account) => {
				// Set the icon for the account
				account.displayInfo.contextualLogo = account.properties.isMsAccount
					? AzureAccountProvider.MicrosoftAccountLogo
					: AzureAccountProvider.WorkSchoolAccountLogo;

				// TODO: Set stale status based on whether we can authenticate or not
			});

			self._isInitialized = true;

			resolve(restoredAccounts);
		});
	}

	public prompt(): Thenable<AzureAccount> {
		let self = this;
		return this.doIfInitialized(() => self.signIn());
	}

	public refresh(account: AzureAccount): Thenable<AzureAccount> {
		let self = this;
		return this.doIfInitialized(() => self.signIn());
	}

	// PRIVATE METHODS /////////////////////////////////////////////////////
	private static loadIcon(iconName: string) {
		let filePath = path.join(__dirname, 'media', iconName);
		try {
			return 'image/svg+xml,' + fs.readFileSync(filePath);
		} catch(e) {
			return '';
		}
	}

	private doIfInitialized<T>(op: () => Thenable<T>): Thenable<T> {
		return this._isInitialized
			? op()
			: Promise.reject(localize('accountProviderNotInitialized', 'Account provider not initialized, cannot perform action'));
	}

	private getAccessTokens(account: AzureAccount): Thenable<AzureAccountSecurityTokenCollection> {
		let self = this;

		let accessTokenPromises: Thenable<void>[] = [];
		let tokenCollection: AzureAccountSecurityTokenCollection = {};
		for (let tenant of account.properties.tenants) {
			let promise = new Promise<void>((resolve, reject) => {
				// TODO: use urijs to generate this URI
				let authorityUrl = `${self._metadata.settings.host}/${tenant.id}`;
				let context = new adal.AuthenticationContext(authorityUrl, null, self._tokenCache);

				// TODO: This is where we should mark the account as stale
				context.acquireToken(
					self._metadata.settings.armResource.id,
					tenant.userId,
					self._metadata.settings.clientId,
					(error: Error, response: adal.TokenResponse | adal.ErrorResponse) => {
						// Handle errors first
						if (error) {
							reject(error);
							return;
						}

						// We know that the response was not an error
						let tokenResponse = <adal.TokenResponse>response;

						// Generate a token object and add it to the collection
						tokenCollection[tenant.id] = {
							expiresOn: tokenResponse.expiresOn,
							resource: tokenResponse.resource,
							token: tokenResponse.accessToken,
							tokenType: tokenResponse.tokenType
						};
						resolve();
					}
				);
			});
			accessTokenPromises.push(promise);
		}

		// Wait until all the tokens have been acquired then return the collection
		return Promise.all(accessTokenPromises)
			.then(() => tokenCollection);
	}

	private getDeviceLoginUserCode(): Thenable<adal.UserCodeInfo> {
		let self = this;

		// Create authentication context and acquire user code
		return new Promise<adal.UserCodeInfo>((resolve, reject) => {
			let context = new adal.AuthenticationContext(self._commonAuthorityUrl, null, self._tokenCache);
			// TODO: How to localize?
			context.acquireUserCode(self._metadata.settings.signInResourceId, self._metadata.settings.clientId, 'en-us',
				(err, response) => {
					if (err) {
						reject(err);
					} else {
						resolve(response);
					}
				}
			);
		});
	}

	private getDeviceLoginToken(deviceLogin: adal.UserCodeInfo): Thenable<adal.TokenResponse> {
		let self = this;

		// Create authentication context and use device login params to get authorization token
		return new Promise<adal.TokenResponse>((resolve, reject) => {
			data.accounts.beginAutoOAuthDeviceCode(deviceLogin.message, deviceLogin.userCode, deviceLogin.verificationUrl);

			let context = new adal.AuthenticationContext(self._commonAuthorityUrl, null, this._tokenCache);
			context.acquireTokenWithDeviceCode(self._metadata.settings.signInResourceId, self._metadata.settings.clientId, deviceLogin, (err, response) => {
				data.accounts.endAutoOAuthDeviceCode();
				if (err) {
					reject(err);
				} else {
					resolve(<adal.TokenResponse>response);
				}
			});
		});
	}

	private getTenants(userId: string, homeTenant: string): Thenable<Tenant[]> {
		let self = this;

		// 1) Get a token we can use for looking up the tenant IDs
		// 2) Send a request to the ARM endpoint (the root management API) to get the list of tenant IDs
		// 3) For all the tenants
		//    b) Get a token we can use for the AAD Graph API
		//    a) Get the display name of the tenant
		//    c) create a tenant object
		// 4) Sort to make sure the "home tenant" is the first tenant on the list
		return this.getToken(userId, AzureAccountProvider.AadCommonTenant, this._metadata.settings.armResource.id)
			.then((armToken: adal.TokenResponse) => {
				let tenantUri = `${self._metadata.settings.armResource.endpoint}/tenants?api-version=2015-01-01`;
				return self.makeWebRequest(armToken, tenantUri);
			})
			.then((tenantResponse: any[]) => {
				let promises: Thenable<Tenant>[] = tenantResponse.map(value => {
					return self.getToken(userId, value.tenantId, self._metadata.settings.graphResource.id)
						.then((graphToken: adal.TokenResponse) => {
							let tenantDetailsUri = `${self._metadata.settings.graphResource.endpoint}/${value.tenantId}/tenantDetails?api-version=2013-04-05`;
							return self.makeWebRequest(graphToken, tenantDetailsUri);
						})
						.then((tenantDetails: any) => {
							return <Tenant>{
								id: value.tenantId,
								userId: userId,
								displayName: tenantDetails.length && tenantDetails[0].displayName
									? tenantDetails[0].displayName
									: localize('azureWorkAccountDisplayName', 'Work or school account')
							};
						});
				});

				return Promise.all(promises);
			})
			.then((tenants: Tenant[]) => {
				let homeTenantIndex = tenants.findIndex(tenant => tenant.id === homeTenant);
				if (homeTenantIndex >= 0) {
					let homeTenant = tenants.splice(homeTenantIndex, 1);
					tenants.unshift(homeTenant[0]);
				}
				return tenants;
			});
	}

	/**
	 * Retrieves a token for the given user ID for the specific tenant ID. If the token can, it
	 * will be retrieved from the cache as per the ADAL API. AFAIK, the ADAL API will also utilize
	 * the refresh token if there aren't any unexpired tokens to use.
	 * @param {string} userId ID of the user to get a token for
	 * @param {string} tenantId Tenant to get the token for
	 * @param {string} resourceId ID of the resource the token will be good for
	 * @returns {Thenable<TokenResponse>} Promise to return a token. Rejected if retrieving the token fails.
	 */
	private getToken(userId: string, tenantId: string, resourceId: string): Thenable<adal.TokenResponse> {
		let self = this;

		return new Promise<adal.TokenResponse>((resolve, reject) => {
			let authorityUrl = `${self._metadata.settings.host}/${tenantId}`;
			let context = new adal.AuthenticationContext(authorityUrl, null, self._tokenCache);
			context.acquireToken(resourceId, userId, self._metadata.settings.clientId,
				(error: Error, response: adal.TokenResponse | adal.ErrorResponse) => {
					if (error) {
						reject(error);
					} else {
						resolve(<adal.TokenResponse>response);
					}
				}
			);
		});
	}

	/**
	 * Performs a web request using the provided bearer token
	 * @param {TokenResponse} accessToken Bearer token for accessing the provided URI
	 * @param {string} uri URI to access
	 * @returns {Thenable<any>} Promise to return the deserialized body of the request. Rejected if error occurred.
	 */
	private makeWebRequest(accessToken: adal.TokenResponse, uri: string): Thenable<any> {
		return new Promise<any>((resolve, reject) => {
			// Setup parameters for the request
			// NOTE: setting json true means the returned object will be deserialized
			let params = {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken.accessToken}`
				},
				json: true
			};

			// Setup the callback to resolve/reject this promise
			let callback = (error, response, body: { error: any; value: any; }) => {
				if (error || body.error) {
					reject(error || body.error);
				} else {
					resolve(body.value);
				}
			};

			// Make the request
			request.get(uri, params, callback);
		});
	}

	private signIn(): Thenable<AzureAccount> {
		let self = this;

		// 1) Get the user code for this login
		// 2) Get an access token from the device code
		// 3) Get the list of tenants
		// 4) Generate the AzureAccount object and return it
		let tokenResponse: adal.TokenResponse = null;
		return this.getDeviceLoginUserCode()
			.then((userCode: adal.UserCodeInfo) => self.getDeviceLoginToken(userCode))
			.then((response: adal.TokenResponse) => {
				tokenResponse = response;
				return self.getTenants(tokenResponse.userId, tokenResponse.userId);
			})
			.then((tenants: Tenant[]) => {
				// Figure out where we're getting the identity from
				let identityProvider = tokenResponse.identityProvider;
				if (identityProvider) {
					identityProvider = identityProvider.toLowerCase();
				}

				// Determine if this is a microsoft account
				let msa = identityProvider && (
					identityProvider.indexOf('live.com') !== -1 ||
					identityProvider.indexOf('live-int.com') !== -1 ||
					identityProvider.indexOf('f8cdef31-a31e-4b4a-93e4-5f571e91255a') !== -1 ||
					identityProvider.indexOf('ea8a4392-515e-481f-879e-6571ff2a8a36') !== -1);

				// Calculate the display name for the user
				let displayName = (tokenResponse.givenName && tokenResponse.familyName)
					? `${tokenResponse.givenName} ${tokenResponse.familyName}`
					: tokenResponse.userId;

				// Calculate the home tenant display name to use for the contextual display name
				let contextualDisplayName = msa
					? localize('microsoftAccountDisplayName', 'Microsoft Account')
					: tenants[0].displayName;

				// Calculate the contextual logo for the account
				let contextualLogo = msa
					? AzureAccountProvider.MicrosoftAccountLogo
					: AzureAccountProvider.WorkSchoolAccountLogo;

				return <AzureAccount>{
					key: {
						providerId: self._metadata.id,
						accountId: tokenResponse.userId
					},
					name: tokenResponse.userId,
					displayInfo: {
						contextualLogo: contextualLogo,
						contextualDisplayName: contextualDisplayName,
						displayName: displayName
					},
					properties: {
						isMsAccount: msa,
						tenants: tenants
					},
					isStale: false
				};
			});
	}
}
