/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import { Emitter } from 'vs/base/common/event';
import { AccountDialog } from 'sql/parts/accountManagement/accountDialog/accountDialog';
import { AccountDialogController } from 'sql/parts/accountManagement/accountDialog/accountDialogController';
import { AccountViewModel } from 'sql/parts/accountManagement/accountDialog/accountViewModel';
import { AccountManagementTestService } from 'sqltest/stubs/accountManagementStubs';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { AccountListRenderer } from 'sql/parts/accountManagement/common/accountListRenderer';

// SUITE STATE /////////////////////////////////////////////////////////////
let instantiationService: TypeMoq.Mock<InstantiationService>;

// TESTS ///////////////////////////////////////////////////////////////////
suite('Account Management Dialog Controller Tests', () => {
	suiteSetup(() => {
		// Create a mock account dialog view model
		let accountViewModel = new AccountViewModel(new AccountManagementTestService());
		let mockAccountViewModel = TypeMoq.Mock.ofInstance(accountViewModel);
		let mockEvent = new Emitter<any>();
		mockAccountViewModel.setup(x => x.addProviderEvent).returns(() => mockEvent.event);
		mockAccountViewModel.setup(x => x.removeProviderEvent).returns(() => mockEvent.event);
		mockAccountViewModel.setup(x => x.updateAccountListEvent).returns(() => mockEvent.event);

		// Create a mocked out instantiation service
		instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Strict);
		instantiationService.setup(x => x.createInstance<AccountViewModel>(TypeMoq.It.isValue(AccountViewModel)))
			.returns(() => mockAccountViewModel.object);
		instantiationService.setup(x => x.createInstance<AccountListRenderer>(TypeMoq.It.isValue(AccountListRenderer)))
			.returns(() => undefined);

		// Create a mock account dialog
		let accountDialog = new AccountDialog(null, null, null, instantiationService.object, null, null, null);
		let mockAccountDialog = TypeMoq.Mock.ofInstance(accountDialog);
		mockAccountDialog.setup(x => x.render())
			.returns(() => undefined);
		mockAccountDialog.setup(x => x.open())
			.returns(() => undefined);
		instantiationService.setup(x => x.createInstance<AccountDialog>(TypeMoq.It.isValue(AccountDialog)))
			.returns(() => mockAccountDialog.object);
	});

	test('Open Account Dialog - Dialog Doesn\'t Exist', () => {
		// Setup: Create instance of the controller
		let controller = new AccountDialogController(instantiationService.object);
		assert.strictEqual(controller.accountDialog, undefined);

		// If: I open the account dialog when one hasn't been opened
		controller.openAccountDialog();

		// Then:
		// ... The account dialog should be defined
		assert.notStrictEqual(controller.accountDialog, undefined);
	});

	test('Open Account Dialog - Dialog Exists', () => {
		// Setup: Create instance of the controller with an account dialog already loaded
		let controller = new AccountDialogController(instantiationService.object);
		controller.openAccountDialog();
		let accountDialog = controller.accountDialog;

		// If: I open the account dialog when one has already been opened
		controller.openAccountDialog();

		// Then: It should be the same dialog that already existed
		assert.equal(controller.accountDialog, accountDialog);
	});
});