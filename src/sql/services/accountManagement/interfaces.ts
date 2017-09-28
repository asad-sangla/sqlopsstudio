/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import {createDecorator} from 'vs/platform/instantiation/common/instantiation';
import {TPromise} from 'vs/base/common/winjs.base';
import {AccountDisplayInfo, AccountKey, AccountProvider, AccountProviderMetadata} from 'data';
import {EventEmitter} from 'vs/base/common/eventEmitter';

export const SERVICE_ID = 'accountManagementService';

export const IAccountManagementService = createDecorator<IAccountManagementService>(SERVICE_ID);

export interface IAccountManagementService {
	_serviceBrand: any;

	// ACCOUNT MANAGEMENT METHODS //////////////////////////////////////////
	getAccountProvider(providerId: string): Thenable<AccountProvider>;
	getAccountProviderMetadata(): Thenable<AccountProviderMetadata[]>;
	getAccountsForProvider(providerId: string): Thenable<Account[]>;
	removeAccount(accountKey: AccountKey): Thenable<void>;

	// UI METHODS //////////////////////////////////////////////////////////
	openAccountListDialog(): TPromise<any>;
	performOAuthAuthorization(url: string, silent: boolean): Thenable<string>;

	// SERVICE MANAGEMENT METHODS /////////////////////////////////////////
	registerProvider(providerMetadata: AccountProviderMetadata, provider: AccountProvider): void;
	shutdown(): void;
	unregisterProvider(providerMetadata: AccountProviderMetadata): void;
}

export interface IAccountStore extends EventEmitter {
	/**
	 * Adds or updates an account produced by an account provider.
	 * Returns a new updated account instance.
	 * @param account - An account.
	 */
	addOrUpdate(account: Account): Promise<Account>;

	/**
	 * Returns all accounts in the store
	 */
	getAccounts(): Promise<Account[]>;

	/**
	 * Returns account that matches a given account key
	 * @param accountKey AccountKey to use to lookup the account
	 * @returns Promise to return the matching account if a match is found, otherwise null is returned
	 */
	getAccountByKey(accountKey: AccountKey): Promise<Account|null>;

	/**
	 * Returns all accounts that belong to a given account provider
	 * @param providerId - ID of the provider to retrieve accounts for
	 */
	getAccountsByProvider(providerId: string): Promise<Account[]>;

	/**
	 * Updates the display information stored for an account.
	 * Returns null if no account was found to update.
	 * Otherwise, returns a new updated account instance.
	 * @param key - The key of an account.
	 * @param displayInfo - The updated display information for the account.
	 */
	updateDisplayInfo(key: AccountKey, displayInfo: AccountDisplayInfo): Promise<Account>;

	/**
	 * Updates the custom properties stored with an account.
	 * Returns null if no account was found to update.
	 * Otherwise, returns a new updated account instance.
	 * @param key - The key of an account.
	 * @param properties - The updated properties for the account.
	 *                     Setting a property to undefined removes the property.
	 */
	updateProperties(key: AccountKey, properties: any): Promise<Account>;

	/**
	 * Updates the state of an account when an account provider indicated it became stale.
	 * Returns null if no account was found to update.
	 * Otherwise, returns a new updated account instance.
	 * @param key - The key of an account.
	 * @param stale - The updated value of the stale property for the account.
	 */
	updateState(key: AccountKey, stale: boolean): Promise<Account>;

	/**
	 * Removes an account.
	 * Returns false if the account was not found.
	 * Otherwise, returns true.
	 * @param key - The key of an account.
	 * @returns	The account that was removed, null if the account doesn't exist
	 */
	remove(key: AccountKey): Promise<Account|null>;

	// TODO: Add change eventing
	// addListener(event: "change", listener: AccountStoreChangeListener): this;
	// addListener(event: string, listener: Function): this;
	// on(event: "change", listener: AccountStoreChangeListener): this;
	// on(event: string, listener: Function): this;
	// once(event: "change", listener: AccountStoreChangeListener): this;
	// once(event: string, listener: Function): this;
	// removeListener(event: "change", listener: AccountStoreChangeListener): this;
	// removeListener(event: string, listener: Function): this;
	// listeners(event: "change"): AccountStoreChangeListener[];
	// listeners(event: string): Function[];
	// emit(event: "change", changes: AccountStoreChanges): boolean;
	// emit(event: string, ...args: any[]): boolean;
}
