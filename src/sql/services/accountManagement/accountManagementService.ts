/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as platform from 'vs/platform/registry/common/platform';
import * as statusbar from 'vs/workbench/browser/parts/statusbar/statusbar';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { Account, AccountKey, AccountProvider, AccountProviderMetadata } from 'data';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { Memento } from 'vs/workbench/common/memento';

import { AccountDialogController } from 'sql/parts/accountManagement/accountDialog/accountDialogController';
import { AccountListStatusbarItem } from 'sql/parts/accountManagement/common/accountListStatusbarItem';
import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';
import { AccountStore } from 'sql/services/accountManagement/accountStore';

export class AccountManagementService implements IAccountManagementService {
	private static ACCOUNT_MEMENTO = 'AccountManagement';

	public _serviceBrand: any;
	private _accountStore: AccountStore;
	private _accountDialogController: AccountDialogController;
	private _providers: { [id: string]: AccountProviderWithMetadata } = {};

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		private _accountMemento: Memento,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IStorageService private _storageService: IStorageService
	) {
		// Create the account store
		if (!this._accountMemento) {
			this._accountMemento = new Memento(AccountManagementService.ACCOUNT_MEMENTO);
		}
		this._accountStore = new AccountStore(_storageService, this._accountMemento);

		// TODO: Add stale event handling to the providers

		// Register status bar item
		// FEATURE FLAG TOGGLE
		if (process.env['VSCODE_DEV']) {
			let statusbarDescriptor = new statusbar.StatusbarItemDescriptor(
				AccountListStatusbarItem,
				statusbar.StatusbarAlignment.LEFT,
				100
			);
			(<statusbar.IStatusbarRegistry>platform.Registry.as(statusbar.Extensions.Statusbar)).registerStatusbarItem(statusbarDescriptor);
		}
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
		return this._accountStore
			// Step 1) Remove the account (and hold onto it)
			.remove(accountKey)
			// Step 2) Clear the sensitive data from the provider
			.then((deletedAccount) => {
				let provider = self._providers[accountKey.providerId];
				provider.provider.clear(deletedAccount);
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
		this._accountMemento.saveMemento();
	}

	public unregisterProvider(providerMetadata: AccountProviderMetadata): void {
		// Delete this account provider
		delete this._providers[providerMetadata.id];
	}

	// TODO: Support for orphaned accounts (accounts with no provider)
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

