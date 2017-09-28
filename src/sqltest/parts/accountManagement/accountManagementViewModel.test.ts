/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import data = require('data');

import { AccountViewModel, ProviderAccountParam } from 'sql/parts/accountManagement/accountDialog/accountViewModel';
import { AccountManagementTestService } from 'sqltest/stubs/accountManagementStubs';

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';

suite('Account Management view model tests', () => {
	let viewModel: AccountViewModel;
	let accountManagementService: TypeMoq.Mock<AccountManagementTestService>;
	let providers: data.AccountProviderMetadata[];
	let account1: data.Account;
	let account2: data.Account;

	setup(() => {
		providers = [{
			id: 'azure',
			displayName: 'Azure'
		}];

		account1 = {
			key: { providerId: 'azure', accountId: 'account1' },
			displayInfo: {
				accountType: 'microsoftAccount',
				contextualDisplayName: 'Microsoft Account',
				displayName: 'Account 1'
			},
			properties: [],
			isStale: false
		};

		account2 = {
			key: { providerId: 'azure', accountId: 'account2' },
			displayInfo: {
				accountType: 'workSchoolAccount',
				contextualDisplayName: 'Work/School Account',
				displayName: 'Account 2'
			},
			properties: [],
			isStale: true
		};

		accountManagementService = TypeMoq.Mock.ofType(AccountManagementTestService);

		accountManagementService.setup(x => x.getAccountProviderMetadata()).returns(() => Promise.resolve(providers));
		accountManagementService.setup(x => x.getAccountsForProvider(TypeMoq.It.isAny())).returns(() => Promise.resolve([account1, account2]));
		viewModel = new AccountViewModel(accountManagementService.object);
	});

	function verifyProviverAccountsList(providerAccountParam: ProviderAccountParam): void {
		assert.equal(providerAccountParam.providerDisplayName, 'Azure');
		assert.equal(providerAccountParam.providerId, 'azure');
		assert.equal(providerAccountParam.accounts.length, 2);
		assert.equal(providerAccountParam.accounts[0], account1);
		assert.equal(providerAccountParam.accounts[1], account2);
	}

	test('getAccountsForProvider should get accounts for each provider correctly', done => {
		viewModel.onUpdateProviderAccounts((providerAccountParam) => verifyProviverAccountsList(providerAccountParam));
		viewModel.getAccountsForProvider().then(() => {
			accountManagementService.verify(x => x.getAccountProviderMetadata(), TypeMoq.Times.once());
			accountManagementService.verify(x => x.getAccountsForProvider(TypeMoq.It.isAny()), TypeMoq.Times.once());
			done();
		});
	});

	test('getAccountsForProvider should still return accounts when one of the providers cannot retrieve the account', done => {
		providers.push({
			id: 'provider2',
			displayName: 'Provider 2'
		});
		accountManagementService = TypeMoq.Mock.ofType(AccountManagementTestService);
		accountManagementService.setup(x => x.getAccountProviderMetadata()).returns(() => Promise.resolve(providers));
		accountManagementService.setup(x => x.getAccountsForProvider('azure')).returns(() => {
			return Promise.resolve([account1, account2]);
		});
		accountManagementService.setup(x => x.getAccountsForProvider('provider2')).returns(() => {
			return Promise.reject(null).then();
		});
		viewModel = new AccountViewModel(accountManagementService.object);
		viewModel.onUpdateProviderAccounts((providerAccountParam) => verifyProviverAccountsList(providerAccountParam));
		viewModel.getAccountsForProvider().then(() => {
			accountManagementService.verify(x => x.getAccountProviderMetadata(), TypeMoq.Times.once());
			accountManagementService.verify(x => x.getAccountsForProvider('azure'), TypeMoq.Times.once());
			accountManagementService.verify(x => x.getAccountsForProvider('provider2'), TypeMoq.Times.once());
			done();
		});
	});
});
