/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';
import { localize } from 'vs/nls';

import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { AutoOAuthDialog } from 'sql/parts/accountManagement/autoOAuthDialog/autoOAuthDialog';
import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

export class AutoOAuthDialogController {
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _autoOAuthDialog: AutoOAuthDialog;
	private _userCode: string;
	private _uri: string;
	private _isDialogOpen: boolean;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IAccountManagementService private _accountManagementService: IAccountManagementService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) { }

	/**
	 * Open auto OAuth dialog
	 */
	public openAutoOAuthDialog(title: string, message: string, userCode: string, uri: string): void {
		if (!this._isDialogOpen) {
			// Create a new dialog if one doesn't exist
			if (!this._autoOAuthDialog) {
				this._autoOAuthDialog = this._instantiationService.createInstance(AutoOAuthDialog);
				this._autoOAuthDialog.onHandleAddAccount(this.handleOnAddAccount, this);
				this._autoOAuthDialog.onCancel(this.handleOnCancel, this);
				this._autoOAuthDialog.onCloseEvent(this.handleOnClose, this);
				this._autoOAuthDialog.render();
			}

			this._userCode = userCode;
			this._uri = uri;

			// Open the dialog
			this._autoOAuthDialog.open(title, message, userCode, uri);
			this._isDialogOpen = true;
		} else {
			//If a oauth flyout is already open, return an error
			let errorMessage = localize('oauthFlyoutIsAlreadyOpen', 'Cannot start auto OAuth. An auto OAuth is already in progress.');
			this._errorMessageService.showDialog(Severity.Error, '', errorMessage);
		}
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

	private handleOnClose(): void {
		this._isDialogOpen = false;
	}

	private handleOnAddAccount(): void {
		this._accountManagementService.copyUserCodeAndOpenBrowser(this._userCode, this._uri);
	}
}
