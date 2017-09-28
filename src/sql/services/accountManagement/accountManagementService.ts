/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as electron from 'electron';
import * as platform from 'vs/platform/registry/common/platform';
import * as statusbar from 'vs/workbench/browser/parts/statusbar/statusbar';
import AccountStore from 'sql/services/accountManagement/accountStore';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { Account, AccountKey, AccountProvider, AccountProviderMetadata } from 'data';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { Memento, Scope as MementoScope } from 'vs/workbench/common/memento';

import { AccountDialogController } from 'sql/parts/accountManagement/accountDialog/accountDialogController';
import { AccountListStatusbarItem } from 'sql/parts/accountManagement/accountListStatusbar/accountListStatusbarItem';
import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

export class AccountManagementService implements IAccountManagementService {
	// CONSTANTS ///////////////////////////////////////////////////////////
	private static ACCOUNT_MEMENTO = 'AccountManagement';

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	public _serviceBrand: any;
	private _accountStore: AccountStore;
	private _accountDialogController: AccountDialogController;
	private _mementoContext: Memento;
	private _oAuthCallbacks: { [eventId: string]: { resolve, reject } } = {};
	private _oAuthEventId: number = 0;
	private _providers: { [id: string]: AccountProviderWithMetadata } = {};

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		private _mementoObj: object,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IStorageService private _storageService: IStorageService
	) {
		let self = this;

		// Create the account store
		if (!this._mementoObj) {
			this._mementoContext = new Memento(AccountManagementService.ACCOUNT_MEMENTO);
			this._mementoObj = this._mementoContext.getMemento(this._storageService, MementoScope.GLOBAL);
		}
		this._accountStore = new AccountStore(this._mementoObj);

		// TODO: Add stale event handling to the providers

		// Register status bar item
		// FEATURE FLAG TOGGLE
		if (process.env['VSCODE_DEV']) {
			let statusbarDescriptor = new statusbar.StatusbarItemDescriptor(
				AccountListStatusbarItem,
				statusbar.StatusbarAlignment.LEFT,
				15000 /* Highest Priority */
			);
			(<statusbar.IStatusbarRegistry>platform.Registry.as(statusbar.Extensions.Statusbar)).registerStatusbarItem(statusbarDescriptor);
		}

		// Register event handler for OAuth completion
		electron.ipcRenderer.on('oauth-reply', (event, args) => {
			self.onOAuthResponse(args);
		});
	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	/**
	 * Retrieves the account provider specified by the provider ID
	 * @param {string} providerId Unique identifier of the provider
	 * @return {Thenable<"data".AccountProvider>} The requested provider
	 */
	public getAccountProvider(providerId: string): Thenable<AccountProvider> {
		return Promise.resolve(this._providers[providerId].provider);
	}

	/**
	 * Retrieves metadata of all providers that have been registered
	 * @returns {Thenable<AccountProviderMetadata[]>} Registered account providers
	 */
	public getAccountProviderMetadata(): Thenable<AccountProviderMetadata[]> {
		return TPromise.as(Object.values(this._providers).map(provider => provider.metadata));
	}

	/**
	 * Retrieves the accounts that belong to a specific provider
	 * @param {string} providerId ID of the provider the returned accounts belong to
	 * @returns {Thenable<Account[]>} Promise to return a list of accounts
	 */
	public getAccountsForProvider(providerId: string): Thenable<Account[]> {
		return this._accountStore.getAccountsByProvider(providerId);
	}

	/**
	 * Removes an account from the account store and clears sensitive data in the provider
	 * @param {"data".AccountKey} accountKey Key for the account to remove
	 * @returns {Thenable<void>} Promise that's resolved when the account is removed
	 */
	public removeAccount(accountKey: AccountKey): Thenable<void> {
		let self = this;

		// Step 1) Remove the account
		// Step 2) Clear the sensitive data from the provider (regardless of whether the account was removed)
		// Step 3) Notify any listeners (if the account was removed)
		return this._accountStore.remove(accountKey)
			.then(result => {
				// TODO: Replace with accountkey once Azure account provider is checked in
				let account = <Account>{ key: accountKey };
				self._providers[accountKey.providerId].provider.clear(account);
				return result;
			})
			.then(result => {
				// TODO: Reinstate once eventing is checked in
				// if (result) {
				// 	self._removeAccountEmitter.fire(accountKey);
				// }
				//return result;
			});
	}

	// UI METHODS //////////////////////////////////////////////////////////
	/**
	 * Opens the account list dialog
	 * @return {TPromise<any>}	Promise that finishes when the account list dialog opens
	 */
	public openAccountListDialog(): TPromise<any> {
		let self = this;
		// If the account list dialog hasn't been defined, create a new one
		if (!self._accountDialogController) {
			self._accountDialogController = self._instantiationService.createInstance(AccountDialogController);
		}

		return new TPromise<void>(() => {
			self._accountDialogController.openAccountDialog();
		});
	}

	/**
	 * Opens a browser window to perform the OAuth authentication
	 * @param {string} url URL to visit that will perform the OAuth authentication
	 * @param {boolean} silent Whether or not to perform authentication silently using browser's cookies
	 * @return {Thenable<string>} Promise to return a authentication token on successful authentication
	 */
	public performOAuthAuthorization(url: string, silent: boolean): Thenable<string> {
		let self = this;
		return new Promise<string>((resolve, reject) => {
			// TODO: replace with uniqid
			let eventId: string = `oauthEvent${self._oAuthEventId++}`;
			self._oAuthCallbacks[eventId] = {
				resolve: resolve,
				reject: reject
			};

			// Setup the args and send the IPC call
			electron.ipcRenderer.send(
				'oauth',
				{
					url: url,
					silent: silent,
					eventId: eventId
				}
			);
		});
	}

	// SERVICE MANAGEMENT METHODS //////////////////////////////////////////
	/**
	 * Called by main thread to register an account provider from extension
	 * @param {AccountProviderMetadata} providerMetadata Metadata of the provider that is being registered
	 * @param {AccountProvider} provider References to the methods of the provider
	 */
	public registerProvider(providerMetadata: AccountProviderMetadata, provider: AccountProvider): void {
		// Store the account provider
		this._providers[providerMetadata.id] = new AccountProviderWithMetadata(providerMetadata, provider);

		// Initialize the provider
		this._accountStore.getAccountsByProvider(providerMetadata.id)
			.then((accounts: Account[]) => { return provider.initialize(accounts); });
	}

	/**
	 * Handler for when shutdown of the application occurs. Writes out the memento.
	 */
	public shutdown(): void {
		if (this._mementoContext) {
			this._mementoContext.saveMemento();
		}
	}

	public unregisterProvider(providerMetadata: AccountProviderMetadata): void {
		// Delete this account provider
		delete this._providers[providerMetadata.id];
	}

	// TODO: Support for orphaned accounts (accounts with no provider)

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private onOAuthResponse(args: object[]): void {
		// Verify the arguments are correct
		if (!args || args['eventId'] === undefined) {
			console.warn('Received invalid OAuth event response args');
			return;
		}

		// Find the event
		let eventId: string = args['eventId'];
		let eventCallbacks = this._oAuthCallbacks[eventId];
		if (!eventCallbacks) {
			console.warn('Received OAuth event response for non-existent eventId');
			return;
		}

		// Parse the args
		let error: string = args['error'];
		let code: string = args['code'];
		if (error) {
			eventCallbacks.reject(error);
		} else {
			eventCallbacks.resolve(code);
		}
	}
}

/**
 * Joins together an account provider and a provider's metadata, used in the provider list
 */
class AccountProviderWithMetadata {
	/**
	 * Metadata about the account provider
	 */
	public metadata: AccountProviderMetadata;

	/**
	 * The Account Provider, itself
	 */
	public provider: AccountProvider;

	constructor(metadata: AccountProviderMetadata, provider: AccountProvider) {
		this.metadata = metadata;
		this.provider = provider;
	}
}

