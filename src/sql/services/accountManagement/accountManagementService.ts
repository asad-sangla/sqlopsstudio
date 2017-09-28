/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as data from 'data';
import * as platform from 'vs/platform/registry/common/platform';
import * as statusbar from 'vs/workbench/browser/parts/statusbar/statusbar';
import * as electron from 'electron';
import AccountStore from 'sql/services/accountManagement/accountStore';
import Event, { Emitter } from 'vs/base/common/event';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { Memento, Scope as MementoScope } from 'vs/workbench/common/memento';
import { AccountDialogController } from 'sql/parts/accountManagement/accountDialog/accountDialogController';
import { AccountListStatusbarItem } from 'sql/parts/accountManagement/accountListStatusbar/accountListStatusbarItem';
import { IAccountManagementService, AccountProviderAddedEventParams } from 'sql/services/accountManagement/interfaces';

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

	// EVENT EMITTERS //////////////////////////////////////////////////////
	private _accountStaleEmitter: Emitter<data.Account>;
	public get accountStaleEvent(): Event<data.Account> { return this._accountStaleEmitter.event; }

	private _addAccountEmitter: Emitter<data.Account>;
	public get addAccountEvent(): Event<data.Account> { return this._addAccountEmitter.event; }

	private _addAccountProviderEmitter: Emitter<AccountProviderAddedEventParams>;
	public get addAccountProviderEvent(): Event<AccountProviderAddedEventParams> { return this._addAccountProviderEmitter.event; }

	private _removeAccountEmitter: Emitter<data.AccountKey>;
	public get removeAccountEvent(): Event<data.AccountKey> { return this._removeAccountEmitter.event; }

	private _removeAccountProviderEmitter: Emitter<data.AccountProviderMetadata>;
	public get removeAccountProviderEvent(): Event<data.AccountProviderMetadata> { return this._removeAccountProviderEmitter.event; }

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

		// Setup the event emitters
		this._accountStaleEmitter = new Emitter<data.Account>();
		this._addAccountEmitter = new Emitter<data.Account>();
		this._addAccountProviderEmitter = new Emitter<AccountProviderAddedEventParams>();
		this._removeAccountEmitter = new Emitter<data.AccountKey>();
		this._removeAccountProviderEmitter = new Emitter<data.AccountProviderMetadata>();

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
	public addAccount(providerId: string): Thenable<data.Account> {
		let self = this;

		// Get the account provider
		let provider = this._providers[providerId];
		if (provider === undefined) {
			throw new Error('Account provider does not exist'); // TODO: Localize?
		}

		// Prompt for a new account
		return provider.provider.prompt()
			.then(account => self._accountStore.addOrUpdate(account))
			.then(result => {
				if (result.accountAdded) {
					self._addAccountEmitter.fire(result.changedAccount);
				}
				if (result.accountModified) {
					// TODO: Fire account modified event
				}
				return result.changedAccount;
			});
	}

	/**
	 * Retrieves the account provider specified by the provider ID
	 * @param {string} providerId Unique identifier of the provider
	 * @return {Thenable<"data".AccountProvider>} The requested provider
	 */
	public getAccountProvider(providerId: string): Thenable<data.AccountProvider> {
		return Promise.resolve(this._providers[providerId].provider);
	}

	/**
	 * Retrieves metadata of all providers that have been registered
	 * @returns {Thenable<data.AccountProviderMetadata[]>} Registered account providers
	 */
	public getAccountProviderMetadata(): Thenable<data.AccountProviderMetadata[]> {
		return TPromise.as(Object.values(this._providers).map(provider => provider.metadata));
	}

	/**
	 * Retrieves the accounts that belong to a specific provider
	 * @param {string} providerId ID of the provider the returned accounts belong to
	 * @returns {Thenable<data.Account[]>} Promise to return a list of accounts
	 */
	public getAccountsForProvider(providerId: string): Thenable<data.Account[]> {
		return this._accountStore.getAccountsByProvider(providerId);
	}

	/**
	 * Removes an account from the account store and clears sensitive data in the provider
	 * @param {"data".AccountKey} accountKey Key for the account to remove
	 * @returns {Thenable<void>} Promise that's resolved when the account is removed
	 */
	public removeAccount(accountKey: data.AccountKey): Thenable<boolean> {
		let self = this;

		// Step 1) Remove the account
		// Step 2) Clear the sensitive data from the provider (regardless of whether the account was removed)
		// Step 3) Notify any listeners (if the account was removed)
		return this._accountStore.remove(accountKey)
			.then(result => {
				self._providers[accountKey.providerId].provider.clear(accountKey);
				return result;
			})
			.then(result => {
				self._providers[accountKey.providerId].provider.clear(accountKey);
				return result;
			})
			.then(result => {
				if (result) {
					self._removeAccountEmitter.fire(accountKey);
				}
				return result;
			});
	}

	// UI METHODS //////////////////////////////////////////////////////////
	/**
	 * Opens a browser window to perform the OAuth authentication
	 * @param {string} url URL to visit that will perform the OAuth authentication
	 * @param {boolean} silent Whether or not to perform authentication silently using browser's cookies
	 * @return {Thenable<string>} Promise to return a authentication token on successful authentication
	 */
	public performOauthAuthorization(url: string, silent: boolean): Thenable<string> {
		let self = this;
		return new Promise<string>((resolve, reject) => {
			// Create event ID to send along with the response
			// let eventId = uniqid(); TODO: FIGURE OUT WHY IN THE SAM HILL THIS DOESN'T WORK
			let eventId = `foobarbaz${self._oAuthEventId++}`;
			self._oAuthCallbacks[eventId] = {
				resolve: resolve,
				reject: reject
			};

			// Setup the args and send the IPC call
			let args = {
				url: url,
				silent: silent,
				eventId: eventId
			};
			electron.ipcRenderer.send('oauth', args);
		});
	}

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

		return self._accountDialogController.openAccountDialog();
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
	 * @param {data.AccountProviderMetadata} providerMetadata Metadata of the provider that is being registered
	 * @param {data.AccountProvider} provider References to the methods of the provider
	 */
	public registerProvider(providerMetadata: data.AccountProviderMetadata, provider: data.AccountProvider): void {
		let self = this;

		// Store the account provider
		this._providers[providerMetadata.id] = {
			metadata: providerMetadata,
			provider: provider
		};

		// Initialize the provider:
		// 1) Get all the accounts that were stored
		// 2) Give those accounts to the provider for rehydration
		// 3) Write the accounts back to the store
		// 4) Fire the event to let folks know we have another account provider now
		this._accountStore.getAccountsByProvider(providerMetadata.id)
			.then((accounts: data.Account[]) => {
				return provider.initialize(accounts);
			})
			.then((accounts: data.Account[]) => {

				let writePromises = accounts.map(account => {
					return self._accountStore.addOrUpdate(account);
				});
				return Promise.all(writePromises)
					.then(() => { return accounts; });
			})
			.then((accounts: data.Account[]) => {
				self._addAccountProviderEmitter.fire ({
					addedProvider: providerMetadata,
					initialAccounts: accounts
				});
			});

		// TODO: Add stale event handling to the providers
	}

	/**
	 * Handler for when shutdown of the application occurs. Writes out the memento.
	 */
	public shutdown(): void {
		if (this._mementoContext) {
			this._mementoContext.saveMemento();
		}
	}

	public unregisterProvider(providerMetadata: data.AccountProviderMetadata): void {
		// Delete this account provider
		delete this._providers[providerMetadata.id];

		// Alert our listeners that we've removed a provider
		this._removeAccountProviderEmitter.fire(providerMetadata);
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
interface AccountProviderWithMetadata {
	metadata: data.AccountProviderMetadata;
	provider: data.AccountProvider;
}
