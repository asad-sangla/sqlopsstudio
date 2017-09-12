/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as data from 'data';
import { IAccountManagementService } from "sql/services/accountManagement/interfaces";
import { TPromise } from "vs/base/common/winjs.base";

export class AccountManagementTestService implements IAccountManagementService {
	_serviceBrand: any;

	getAccountProvider(providerId: string): Thenable<data.AccountProvider> {
		return undefined;
	}

	getAccountProviderMetadata(): Thenable<data.AccountProviderMetadata[]> {
		return undefined;
	}

	getAccountsForProvider(providerId: string): Thenable<Account[]> {
		return undefined;
	}

	removeAccount(accountKey: data.AccountKey): Thenable<void> {
		return undefined;
	}

	openAccountListDialog(): TPromise<any> {
		return undefined;
	}

	registerProvider(providerMetadata: data.AccountProviderMetadata, provider: data.AccountProvider): void {
		return undefined;
	}

	shutdown(): void {
		return undefined;
	}

	unregisterProvider(providerMetadata: data.AccountProviderMetadata): void {
		return undefined;
	}
}

export class AccountProviderStub implements data.AccountProvider {
	clear(account: data.Account): Thenable<void> {
		return Promise.resolve();
	}

	initialize(storedAccounts: data.Account[]): Thenable<data.Account[]> {
		return Promise.resolve(storedAccounts);
	}

	prompt(): Thenable<data.Account> {
		return Promise.resolve(undefined);
	}

	refresh(account: data.Account): Thenable<data.Account> {
		return Promise.resolve(account);
	}
}