/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {IStatusbarItem} from "vs/workbench/browser/parts/statusbar/statusbar";
import {$, append} from "vs/base/browser/dom";
import {combinedDisposable, IDisposable} from "vs/base/common/lifecycle";
import {IAccountManagementService} from "sql/services/accountManagement/interfaces";
import {IInstantiationService} from "vs/platform/instantiation/common/instantiation";
import {TPromise} from 'vs/base/common/winjs.base';
import {Action} from "vs/base/common/actions";
import {onUnexpectedError} from "vs/base/common/errors";

export class AccountListStatusbarItem implements IStatusbarItem {
	private _rootElement: HTMLElement;
	//private _iconElement: HTMLElement;
	private _textElement: HTMLElement;
	private _toDispose: IDisposable[];

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) {
		this._toDispose = [];
	}

	public render(container: HTMLElement): IDisposable {
		// Create root element for account list
		this._rootElement = append(container, $('.query-status-group'));
		this._rootElement.title = "Manage Linked Accounts"; 	// TODO: Localize
		this._rootElement.onclick = () => this._onClick();

		//this._iconElement = append(this._rootElement,);

		this._textElement = append(this._rootElement, $('a.editor-status-selection'));
		this._textElement.textContent = "Accounts";

		return combinedDisposable(this._toDispose);
	}

	private _onClick() {
		const action = this._instantiationService.createInstance(ShowAccountListAction, ShowAccountListAction.ID, ShowAccountListAction.LABEL);

		action.run().done(null, onUnexpectedError);
		action.dispose();
	}
}

export class ShowAccountListAction extends Action {
	public static ID = 'sql.action.accounts.openAccountManagement';
	public static LABEL = "Open Linked Accounts Management";	// TODO: Localize

	constructor(id: string, label: string,
				@IAccountManagementService protected _accountManagementService: IAccountManagementService) {
		super(id, label);
	}

	run(): TPromise<any> {
		return this._accountManagementService.openAccountListDialog();
	}
}