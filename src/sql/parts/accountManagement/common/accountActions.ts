/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IMessageService, IConfirmation } from 'vs/platform/message/common/message';

import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

/**
 * Actions to add a new account
 */
export class AddLinkedAccountAction extends Action {
	public static ID = 'account.addLinkedAccount';
	public static LABEL = localize('addAccount', 'Add an account');

	constructor(
		id: string,
		label: string,
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) {
		super(id, label);
		this.class = 'add-linked-account-action';
	}

	public run(): TPromise<boolean> {
		// Todo: add a new account
		return TPromise.as(true);
	}
}


/**
 * Actions to remove the account
 */
export class RemoveAccountAction extends Action {
	public static ID = 'account.removeAccount';
	public static LABEL = localize('removeAccount', 'Remove');

	constructor(
		id: string,
		label: string,
		private _accountName: string,
		@IMessageService private _messageService: IMessageService,
	) {
		super(id, label, 'remove-account-action icon remove');
	}

	public run(): TPromise<boolean> {
		// Ask for Confirm
		let confirm: IConfirmation = {
			message: localize('confirmRemoveUserAccountMessage', "Are you sure you want to remove '{0}'?", this._accountName),
			primaryButton: localize('yes', 'Yes'),
			secondaryButton: localize('no', 'No'),
			type: 'question'
		};

		if (!this._messageService.confirm(confirm)) {
			return TPromise.as(null);
		}

		// Todo: remove the account
		return TPromise.as(true);
	}
}

/**
 * Actions to apply filter to the account
 */
export class ApplyFilterAction extends Action {
	public static ID = 'account.applyFilters';
	public static LABEL = localize('applyFilters', 'Apply Filters');

	constructor(
		id: string,
		label: string
	) {
		super(id, label, 'apply-filters-action icon filter');
	}

	public run(): TPromise<boolean> {
		// Todo: apply filter to the account
		return TPromise.as(true);
	}
}

/**
 * Actions to refresh the account
 */
export class RefreshAccountAction extends Action {
	public static ID = 'account.refresh';
	public static LABEL = localize('refreshAccount', 'Reenter your credentials');

	constructor(
		id: string,
		label: string
	) {
		super(id, label, 'refresh-account-action icon refresh');
	}
	public run(): TPromise<boolean> {
		// Todo: refresh the account
		return TPromise.as(true);
	}
}