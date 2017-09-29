/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IGridInfo } from 'sql/parts/grid/common/interfaces';
import { DataService } from 'sql/parts/grid/services/dataService';
import { GridActionProvider } from 'sql/parts/grid/views/gridActions';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { IAction, Action } from 'vs/base/common/actions';

export class EditDataGridActionProvider extends GridActionProvider {

	constructor(dataService: DataService, selectAllCallback: (index: number) => void,
		private _deleteRowCallback: (index: number) => void,
		private _revertRowCallback: (index: number) => void) {
		super(dataService, selectAllCallback);
	}
	/**
	 * Return actions given a click on an edit data grid
	 */
	public getGridActions(): TPromise<IAction[]> {
		let actions: IAction[] = [];
		actions.push(new DeleteRowAction(DeleteRowAction.ID, DeleteRowAction.LABEL, this._deleteRowCallback));
		actions.push(new RevertRowAction(RevertRowAction.ID, RevertRowAction.LABEL, this._revertRowCallback));

		return TPromise.as(actions);
	}
}

export class DeleteRowAction extends Action {
	public static ID = 'grid.deleteRow';
	public static LABEL = localize('deleteRow', 'Delete Row');

	constructor(
		id: string,
		label: string,
		private callback: (index: number) => void
	) {
		super(id, label);
	}

	public run(gridInfo: IGridInfo): TPromise<boolean> {
		this.callback(gridInfo.rowIndex);
		return TPromise.as(true);
	}
}

export class RevertRowAction extends Action {
	public static ID = 'grid.revertRow';
	public static LABEL = localize('revertRow', 'Revert Row');

	constructor(
		id: string,
		label: string,
		private callback: (index: number) => void
	) {
		super(id, label);
	}

	public run(gridInfo: IGridInfo): TPromise<boolean> {
		this.callback(gridInfo.rowIndex);
		return TPromise.as(true);
	}
}
