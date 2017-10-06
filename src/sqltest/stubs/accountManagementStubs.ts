/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as data from 'data';
import Event from 'vs/base/common/event';
import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';
import { AccountProviderAddedEventParams, UpdateAccountListEventParams } from 'sql/services/accountManagement/eventTypes';
import { TPromise } from 'vs/base/common/winjs.base';

export class AccountManagementTestService implements IAccountManagementService {
	_serviceBrand: any;

	public get addAccountProviderEvent(): Event<AccountProviderAddedEventParams> {return () => {return undefined;};}
	public get removeAccountProviderEvent(): Event<data.AccountProviderMetadata> {return () => {return undefined;};}
	public get updateAccountListEvent(): Event<UpdateAccountListEventParams> {return () => {return undefined;};}

	addAccount(providerId: string): Thenable<data.Account> {
		return undefined;
	}

	getAccountProviderMetadata(): Thenable<data.AccountProviderMetadata[]> {
		return undefined;
	}

	getAccountsForProvider(providerId: string): Thenable<data.Account[]> {
		return undefined;
	}

	getSecurityToken(account: data.Account): Thenable<{}> {
		return undefined;
	}

	removeAccount(accountKey: data.AccountKey): Thenable<boolean> {
		return undefined;
	}

	openAccountListDialog(): TPromise<any> {
		return undefined;
	}

	performOAuthAuthorization(url: string, silent: boolean): Thenable<string> {
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
	clear(account: data.AccountKey): Thenable<void> {
		return Promise.resolve();
	}

	getSecurityToken(account: data.Account): Thenable<{}> {
		return Promise.resolve({});
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
