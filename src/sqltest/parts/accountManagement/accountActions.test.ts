/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import * as data from 'data';
import * as TypeMoq from 'typemoq';
import { AddAccountAction, RemoveAccountAction } from 'sql/parts/accountManagement/common/accountActions';
import { AccountManagementTestService } from 'sqltest/stubs/accountManagementStubs';
import { MessageServiceStub } from 'sqltest/stubs/messageServiceStub';

let testAccount = <data.Account>{
	key: {
		providerId: 'azure',
		accountId: 'testAccount'
	},
	displayInfo: {
		contextualLogo: { light: '', dark: '' },
		displayName: 'Test Account',
		contextualDisplayName: 'Azure Account'
	},
	isStale: false
};

suite('Account Management Dialog Actions Tests', () => {
	test('AddAccount - Success', (done) => {
		// Setup: Create an AddAccountAction object
		let ams = getMockAccountManagementService(true);
		let param = 'azure';
		let action = new AddAccountAction(param, ams.object);

		// If: I run the action when it will resolve
		action.run()
			.then(result => {
				// Then:
				// ... I should have gotten true back
				assert.ok(result);

				// ... The account management service should have gotten a add account request
				ams.verify(x => x.addAccount(param), TypeMoq.Times.once());
			})
			.then(
			() => done(),
			err => done(err)
			);
	});

	test('AddAccount - Failure', (done) => {
		// Setup: Create an AddAccountAction object
		let ams = getMockAccountManagementService(false);
		let param = 'azure';
		let action = new AddAccountAction(param, ams.object);

		// If: I run the action when it will reject
		action.run()
			.then(
			() => done('action resolved when it should have rejected'),
			() => {
				try {
					// Then:
					// ... The promise should have rejected
					// ... The account management service should have gotten a add account request
					ams.verify(x => x.addAccount(param), TypeMoq.Times.once());
					done();
				} catch (e) {
					done(e);
				}
			}
			);
	});

	test('RemoveAccount - Confirm Success', (done) => {
		// Setup: Create an AddAccountAction object
		let ams = getMockAccountManagementService(true);
		let ms = getMockMessageService(true);
		let action = new RemoveAccountAction(testAccount, ms.object, ams.object);

		// If: I run the action when it will resolve
		action.run()
			.then(result => {
				// Then:
				// ... I should have gotten true back
				assert.ok(result);

				// ... A confirmation dialog should have opened
				ms.verify(x => x.confirm(TypeMoq.It.isAny()), TypeMoq.Times.once());

				// ... The account management service should have gotten a remove account request
				ams.verify(x => x.removeAccount(TypeMoq.It.isValue(testAccount.key)), TypeMoq.Times.once());
			})
			.then(
			() => done(),
			err => done(err)
			);
	});

	test('RemoveAccount - Declined Success', (done) => {
		// Setup: Create an AddAccountAction object
		let ams = getMockAccountManagementService(true);
		let ms = getMockMessageService(false);
		let action = new RemoveAccountAction(testAccount, ms.object, ams.object);

		// If: I run the action when it will resolve
		action.run()
			.then(result => {
				try {
					// Then:
					// ... I should have gotten false back
					assert.ok(!result);

					// ... A confirmation dialog should have opened
					ms.verify(x => x.confirm(TypeMoq.It.isAny()), TypeMoq.Times.once());

					// ... The account management service should not have gotten a remove account request
					ams.verify(x => x.removeAccount(TypeMoq.It.isAny()), TypeMoq.Times.never());

					done();
				} catch (e) {
					done(e);
				}
			});
	});

	test('RemoveAccount - Failure', (done) => {
		// Setup: Create an AddAccountAction object
		let ams = getMockAccountManagementService(false);
		let ms = getMockMessageService(true);
		let action = new RemoveAccountAction(testAccount, ms.object, ams.object);

		// If: I run the action when it will reject
		action.run()
			.then(
			() => done('action resolved when it should have rejected'),
			() => {
				try {
					// Then:
					// ... The promise should have rejected
					// ... The account management service should have gotten a remove account request
					ams.verify(x => x.removeAccount(TypeMoq.It.isValue(testAccount.key)), TypeMoq.Times.once());
					done();
				} catch (e) {
					done(e);
				}
			}
			);
	});
});

function getMockAccountManagementService(resolve: boolean): TypeMoq.Mock<AccountManagementTestService> {
	let mockAccountManagementService = TypeMoq.Mock.ofType(AccountManagementTestService);

	mockAccountManagementService.setup(x => x.addAccount(TypeMoq.It.isAnyString()))
		.returns(resolve ? () => Promise.resolve(null) : () => Promise.reject(null));
	mockAccountManagementService.setup(x => x.removeAccount(TypeMoq.It.isAny()))
		.returns(resolve ? () => Promise.resolve(true) : () => Promise.reject(null).then());

	return mockAccountManagementService;
}

function getMockMessageService(confirm: boolean): TypeMoq.Mock<MessageServiceStub> {
	let mockMessageService = TypeMoq.Mock.ofType(MessageServiceStub);

	mockMessageService.setup(x => x.confirm(TypeMoq.It.isAny()))
		.returns(() => confirm);

	return mockMessageService;
}