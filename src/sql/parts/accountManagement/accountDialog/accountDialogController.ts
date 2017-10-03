/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { AccountDialog } from 'sql/parts/accountManagement/accountDialog/accountDialog';

export class AccountDialogController {

	private _accountDialog: AccountDialog;
	public get accountDialog(): AccountDialog { return this._accountDialog; }

	constructor( @IInstantiationService private _instantiationService: IInstantiationService) { }

	/**
	 * Open account dialog
	 */
	public openAccountDialog(): void {
		// Create a new dialog if one doesn't exist
		if (!this._accountDialog) {
			this._accountDialog = this._instantiationService.createInstance(AccountDialog);
			this._accountDialog.onCloseEvent(() => this.handleOnClose());
			this._accountDialog.render();
		}

		// Open the dialog
		this._accountDialog.open();
	}

	private handleOnClose(): void { }
}
