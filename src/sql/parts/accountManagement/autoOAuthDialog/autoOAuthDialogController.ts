/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { AutoOAuthDialog } from 'sql/parts/accountManagement/autoOAuthDialog/autoOAuthDialog';
import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

export class AutoOAuthDialogController {
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _autoOAuthDialog: AutoOAuthDialog;
	private _userCode: string;
	private _uri: string;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) { }

	/**
	 * Open auto OAuth dialog
	 */
	public openAutoOAuthDialog(title: string, message: string, userCode: string, uri: string): void {
		// Create a new dialog if one doesn't exist
		if (!this._autoOAuthDialog) {
			this._autoOAuthDialog = this._instantiationService.createInstance(AutoOAuthDialog);
			this._autoOAuthDialog.onHandleAddAccount(this.handleOnAddAccount, this);
			this._autoOAuthDialog.onCancel(this.handleOnCancel, this);
			this._autoOAuthDialog.render();
		}

		this._userCode = userCode;
		this._uri = uri;

		// Open the dialog
		this._autoOAuthDialog.open(title, message, userCode, uri);
	}

	/**
	 * Close auto OAuth dialog
	 */
	public closeAutoOAuthDialog(): void {
		this._autoOAuthDialog.close();
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private handleOnCancel(): void {
		// todo: handle on cancel add account account
	}

	private handleOnAddAccount(): void {
		this._accountManagementService.copyUserCodeAndOpenBrowser(this._userCode, this._uri);
	}
}
