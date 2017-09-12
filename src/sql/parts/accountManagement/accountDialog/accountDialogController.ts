/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { AccountDialog } from 'sql/parts/accountManagement/accountDialog/accountDialog';

export class AccountDialogController {

	private _accountDialog: AccountDialog;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	private handleOnClose(): void {

	}

	/**
	 * Open account dialog
	 */
	public openAccountDialog(): TPromise<void> {
		if (!this._accountDialog) {
			this._accountDialog = this._instantiationService.createInstance(AccountDialog);
			this._accountDialog.onCloseEvent(() => this.handleOnClose());
			this._accountDialog.render();
			this._accountDialog.viewModel.getAccountsForProvider();
		}

		return new TPromise<void>(() => {
			this._accountDialog.open();
		});
	}
}
