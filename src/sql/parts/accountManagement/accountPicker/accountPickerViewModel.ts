/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as data from 'data';
import Event, { Emitter } from 'vs/base/common/event';

import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

/**
 * View model for account picker
 */
export class AccountPickerViewModel {
	private static AZURE_ID = 'azure';

	private _onUpdateAccountList = new Emitter<data.Account[]>();
	public onUpdateProviderAccounts: Event<data.Account[]> = this._onUpdateAccountList.event;

	constructor(
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) {
	}

	/**
	 * Get all azure accounts
	 */
	public getAllAzureAccounts(): Thenable<void> {
		return this._accountManagementService.getAccountsForProvider(AccountPickerViewModel.AZURE_ID).then((accounts: data.Account[]) => {
			if (accounts) {
				this._onUpdateAccountList.fire(accounts);
			}
		});
	}
}