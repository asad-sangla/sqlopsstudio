/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import {IAccountStore} from "./interfaces";
import {IStorageService} from "vs/platform/storage/common/storage";
import {Memento, Scope as MementoScope} from "vs/workbench/common/memento";
import {Account, AccountDisplayInfo, AccountKey, AccountStoreChanges} from "data";
import {EventEmitter} from 'vs/base/common/eventEmitter';

export class AccountStore extends EventEmitter implements IAccountStore {
	private static MEMENTO_KEY = 'Microsoft.SqlTools.Accounts';

	private _accountsInMemory: Account[];
	private _activeOperation: Promise<any>;
	private _memento: object;

	constructor(storageService: IStorageService, context: Memento) {
		super();		// TODO: Make proper call to eventemitter constructor
		if (context) {
			this._memento = context.getMemento(storageService, MementoScope.GLOBAL);
		}
	}

	// IAcccountStore IMPLEMENTATION ///////////////////////////////////////
	public addOrUpdate(newAccount: Account): Promise<Account> {
		return this.doOperation(() => this.mutateAccounts(accounts => {
			let index = accounts.findIndex(account => AccountStore.accountKeyEqual(newAccount.key, account.key));
			if (index < 0) {
				// No matching account found, insert new one
				accounts.push(newAccount);
				return newAccount;
			}

			// Account found, update the matching account
			return AccountStore.update(accounts, index, newAccount.displayInfo, newAccount.properties, newAccount.isStale);
		}));
	}

	public getAccounts(): Promise<Account[]> {
		return this.doOperation(() => this.getAccountsWithRefresh(false));
	}

	public getAccountByKey(accountKey: AccountKey): Promise<Account|null> {
		return this.doOperation(() => {
			let accounts = this.getAccountsWithRefresh(false);
			let matchingAccounts = accounts.filter((account: Account) => AccountStore.accountKeyEqual(account.key, accountKey));
			return matchingAccounts.length === 1 ? matchingAccounts[0] : null;
		});
	}

	public getAccountsByProvider(providerId: string): Promise<Account[]> {
		return this.doOperation(() => {
			let accounts = this.getAccountsWithRefresh(false);
			return accounts.filter((account: Account) => account.key.providerId === providerId);
		});
	}

	public remove(key: AccountKey): Promise<Account|null> {
		return this.doOperation(() => this.mutateAccounts(accounts => {
			let index = accounts.findIndex(account => AccountStore.accountKeyEqual(key, account.key));
			if (index < 0) {
				return null;
			}

			let removedAccounts = accounts.splice(index, 1);
			if (removedAccounts.length !== 1) {
				return null;
			}
			return removedAccounts[0];
		}));
	}

	public updateDisplayInfo(key: AccountKey, displayInfo: AccountDisplayInfo) {
		return this.updateAccountHelper(key, displayInfo, null, null);
	}

	public updateProperties(key: AccountKey, properties: any) {
		return this.updateAccountHelper(key, null, properties, null);
	}

	public updateState(key: AccountKey, stale: boolean) {
		return this.updateAccountHelper(key, null, null, stale);
	}

	// PRIVATE STATIC HELPERS //////////////////////////////////////////////
	private static accountKeyEqual(key1: AccountKey, key2: AccountKey): boolean {
		// Filter on the provider ID
		if (key1.providerId !== key2.providerId) {
			// Provider IDs do not match
			return false;
		}

		// Filter on the provider arguments if either side has them
		if (key1.providerArgs) {
			if (!key2.providerArgs) {
				// Latest has provider args, original does not
				return false;
			}

			for (let propertyKey in key1.providerArgs) {
				if (key2.providerArgs[propertyKey] !==  key1.providerArgs[propertyKey]) {
					// Element in provider args do not match
					return false;
				}
			}
		}

		// Filter on the account ID
		return key2.accountId === key1.providerId;
	}

	private static merge(account: Account, displayInfo?: AccountDisplayInfo, properties?: any, stale?: boolean): Account|null {
		let newAccount: Account = {
			key: account.key,
			name: account.name,
			displayInfo: account.displayInfo,
			properties: account.properties,
			isStale: account.isStale
		};
		let hasChanges = false;

		// Take any display info changes
		if (displayInfo && account.displayInfo !== displayInfo) {
			let displayChanges = account.displayInfo.contextualLogo !== displayInfo.contextualLogo
				|| account.displayInfo.contextualDisplayName !== displayInfo.contextualDisplayName
				|| account.displayInfo.displayName !== displayInfo.displayName;
			if (displayChanges) {
				newAccount.displayInfo = displayInfo;
				hasChanges = true;
			}
		}

		// Merge any changes to the properties
		if (properties && account.properties !== properties) {
			// Make a shallow copy of the original properties, if any
			newAccount.properties = {};
			if (account.properties) {
				for(let key in account.properties) {
					if (Object.prototype.hasOwnProperty.call(account.properties, key)) {
						newAccount.properties[key] = account.properties[key];
					}
				}
			}

			// Add new properties or update or remove original properties
			for (let key in properties) {
				if (typeof properties[key] !== 'undefined') {
					// TODO: Recursively check array and objects for equality
					if (newAccount.properties[key] !== properties[key]) {
						// Add new property or update original property
						newAccount.properties[key] = properties[key];
						hasChanges = true;
					}
				} else {
					// Remove original property
					delete newAccount.properties[key];
					hasChanges = true;
				}
			}
		}

		// Take any stale changes
		if (typeof stale === 'boolean' && account.isStale !== stale) {
			newAccount.isStale = stale;
			hasChanges = true;
		}

		return hasChanges ? newAccount : null;
	}

	private static update(accounts: Account[], index: number, displayInfo?: AccountDisplayInfo, properties?: any, stale?: boolean): Account {
		let updatedAccount = AccountStore.merge(accounts[index], displayInfo, properties, stale);
		if (updatedAccount) {
			accounts[index] = updatedAccount;
		}

		return accounts[index];
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private doOperation<T>(op: () => T) {
		// Initialize the active operation to an empty promise if necessary
		let activeOperation = this._activeOperation || Promise.resolve<any>(null);

		// Chain the operation to perform to the end of the existing promise
		activeOperation = activeOperation.then(op);

		// Add a catch at the end to make sure we can continue after any errors
		activeOperation.catch(() => {
			// TODO: Log the error
		});

		// Point the current active operation to this one
		this._activeOperation = activeOperation;
		return <Promise<T>>this._activeOperation;
	}

	private getAccountsWithRefresh(refresh: boolean): Account[] {
		if (!this._accountsInMemory || refresh) {
			// Read accounts and refresh baseline
			let accounts = this.readAccounts();
			this._accountsInMemory = this.sync(accounts);
		}
		return this._accountsInMemory;
	}

	private mutateAccounts<T>(mutateOperation: (accounts: Account[]) => T): T {
		// A mutation first refreshes the in-memory account list and applies the mutation on top of
		// that list of accounts
		let accounts = this.getAccountsWithRefresh(true);

		// Make a shallow copy of the accounts so that it is an isolated mutation until committed
		accounts = accounts.slice();
		let result = mutateOperation(accounts);

		// Write the changes to the store and return the result
		this.writeAccounts(accounts);
		this._accountsInMemory = this.sync(accounts);
		return result;
	}

	private onAccountsChanged() {
		// Refresh the list of accounts, which will synchronize the in memory accounts which will
		// emit a change event if any changes were actually made
		this.doOperation(() => this.getAccountsWithRefresh(true));
	}

	private readAccounts(): Account[] {
		// Initialize the account list if it isn't already
		let accounts = this._memento[AccountStore.MEMENTO_KEY];
		if (!accounts) {
			accounts = [];
		}

		// Return the list of accounts from the Memento
		return accounts;
	}

	private sync(latest: Account[]): Account[] {
		if (!this._accountsInMemory) {
			// No baseline yet; take the latest
			return latest;
		}

		let changes: AccountStoreChanges = {
			added: [],
			modified: [],
			removed: []
		};
		let result: Account[] = [];

		// Handle new and modified accounts
		for (let i = 0; i < latest.length; i++) {
			let latestAccount = latest[i];
			let index = this._accountsInMemory.findIndex(
				(originalAccount: Account) => AccountStore.accountKeyEqual(latestAccount.key, originalAccount.key)
			);

			if (index < 0) {
				// Account only exists in latest
				changes.added.push(latestAccount);
				result.push(latestAccount);
			} else {
				// Account exists in original and latest
				let originalAccount = this._accountsInMemory[index];
				let mergedAccount = AccountStore.merge(originalAccount, latestAccount.displayInfo, latestAccount.properties, latestAccount.isStale);

				if (mergedAccount) {
					// Original and latest accounts are different and produced a new merged account
					changes.modified.push({before: originalAccount, after: mergedAccount});
				}
				result.push(mergedAccount || originalAccount);
			}
		}

		// Handle Deleted accounts
		for (let i = 0; i < this._accountsInMemory.length; i++) {
			let originalAccount = this._accountsInMemory[i];
			let index = latest.findIndex((latestAccount: Account) => AccountStore.accountKeyEqual(originalAccount.key, latestAccount.key));

			if (index < 0) {
				// Account only exists in original
				changes.removed.push(this._accountsInMemory[i]);
			}
		}

		// Asynchronously emit change event if there were any changes
		if (changes.added.length || changes.modified.length || changes.removed.length) {
			setTimeout(() => this.emit('change', changes), 0);
		}

		// Return the new collection of accounts
		return result;
	}

	private updateAccountHelper(
		key: AccountKey,
		displayInfo?: AccountDisplayInfo,
		properties?: any,
		stale?: boolean
	): Promise<Account|null> {
		return this.doOperation(() => this.mutateAccounts(accounts => {
			let index = accounts.findIndex(account => AccountStore.accountKeyEqual(key, account.key));
			if (index < 0) {
				return null;
			}

			return AccountStore.update(accounts, index, displayInfo, properties, stale);
		}));
	}

	private writeAccounts(accounts: Account[]): void {
		// Step 1) Write the account key to the memento
		this._memento[AccountStore.MEMENTO_KEY] = accounts;
		this.onAccountsChanged();
	}
}
