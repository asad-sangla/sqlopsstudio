/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Severity from 'vs/base/common/severity';
import { AccountDialog } from 'sql/parts/accountManagement/accountDialog/accountDialog';
import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { localize } from 'vs/nls';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export class AccountDialogController {

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _addAccountErrorTitle = localize('addAccountErrorTitle', 'Error adding account');

	private _accountDialog: AccountDialog;
	public get accountDialog(): AccountDialog { return this._accountDialog; }

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) { }

	/**
	 * Open account dialog
	 */
	public openAccountDialog(): void {
		let self = this;

		// Create a new dialog if one doesn't exist
		if (!this._accountDialog) {
			this._accountDialog = this._instantiationService.createInstance(AccountDialog);
			this._accountDialog.onAddAccountErrorEvent(msg => { self.handleOnAddAccountError(msg); });
			this._accountDialog.onCloseEvent(() => { self.handleOnClose(); });
			this._accountDialog.render();
		}

		// Open the dialog
		this._accountDialog.open();
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private handleOnClose(): void { }

	private handleOnAddAccountError(msg: string): void {
		this._errorMessageService.showDialog(Severity.Error, this._addAccountErrorTitle, msg);
	}
}
