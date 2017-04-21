/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IGridInfo, IRange, SaveFormat, CsvFormat, JsonFormat, ExcelFormat } from 'sql/parts/grid/common/interfaces';
import { DataService } from 'sql/parts/grid/services/dataService';
import * as WorkbenchUtils from 'sql/parts/common/sqlWorkbenchUtils';

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { IAction, Action } from 'vs/base/common/actions';

export class GridActionProvider {

	constructor(protected _dataService: DataService, protected _selectAllCallback: (index: number) => void) {

	}
	/**
	 * Return actions given a click on a grid
	 */
	public getGridActions(): TPromise<IAction[]> {
		let actions: IAction[] = [];
		actions.push(new SaveResultAction(SaveResultAction.SAVECSV_ID, SaveResultAction.SAVECSV_LABEL, CsvFormat, this._dataService));
		actions.push(new SaveResultAction(SaveResultAction.SAVEJSON_ID, SaveResultAction.SAVEJSON_LABEL, JsonFormat, this._dataService));
		actions.push(new SaveResultAction(SaveResultAction.SAVEEXCEL_ID, SaveResultAction.SAVEEXCEL_LABEL, ExcelFormat, this._dataService));
		actions.push(new SelectAllGridAction(SelectAllGridAction.ID, SelectAllGridAction.LABEL, this._selectAllCallback));
		actions.push(new CopyResultAction(CopyResultAction.COPY_ID, CopyResultAction.COPY_LABEL, false, this._dataService));
		actions.push(new CopyResultAction(CopyResultAction.COPYWITHHEADERS_ID, CopyResultAction.COPYWITHHEADERS_LABEL, true, this._dataService));

		return TPromise.as(actions);
	}

	/**
	 * Return actions given a click on a messages pane
	 */
	public getMessagesActions(dataService: DataService, selectAllCallback: () => void): TPromise<IAction[]> {
		let actions: IAction[] = [];
		actions.push(new CopyMessagesAction(CopyMessagesAction.ID, CopyMessagesAction.LABEL));
		actions.push(new SelectAllMessagesAction(SelectAllMessagesAction.ID, SelectAllMessagesAction.LABEL, selectAllCallback));
		return TPromise.as(actions);
	}
}

export class SaveResultAction extends Action {
	public static SAVECSV_ID = 'grid.saveAsCsv';
	public static SAVECSV_LABEL = localize('saveAsCsv', 'Save As CSV');

	public static SAVEJSON_ID = 'grid.saveAsJson';
	public static SAVEJSON_LABEL = localize('saveAsJson', 'Save As JSON');

	public static SAVEEXCEL_ID = 'grid.saveAsCsv';
	public static SAVEEXCEL_LABEL = localize('saveAsExcel', 'Save As Excel');

	constructor(
		id: string,
		label: string,
		private format: SaveFormat,
		private dataService: DataService
	) {
		super(id, label);
	}

	public run(gridInfo: IGridInfo): TPromise<boolean> {
		this.dataService.sendSaveRequest({
			batchIndex: gridInfo.batchIndex,
			resultSetNumber: gridInfo.resultSetNumber,
			selection: gridInfo.selection,
			format: this.format
		});
		return TPromise.as(true);
	}
}

export class CopyResultAction extends Action {
	public static COPY_ID = 'grid.copySelection';
	public static COPY_LABEL = localize('copySelection', 'Copy');

	public static COPYWITHHEADERS_ID = 'grid.copyWithHeaders';
	public static COPYWITHHEADERS_LABEL = localize('copyWithHeaders', 'Copy With Headers');

	constructor(
		id: string,
		label: string,
		private copyHeader: boolean,
		private dataService: DataService
	) {
		super(id, label);
	}

	public run(gridInfo: IGridInfo): TPromise<boolean> {
		this.dataService.copyResults(gridInfo.selection, gridInfo.batchIndex, gridInfo.resultSetNumber, this.copyHeader);
		return TPromise.as(true);
	}
}

export class SelectAllGridAction extends Action {
	public static ID = 'grid.selectAll';
	public static LABEL = localize('selectAll', 'Select All');

	constructor(
		id: string,
		label: string,
		private selectAllCallback: (index: number) => void
	) {
		super(id, label);
	}

	public run(gridInfo: IGridInfo): TPromise<boolean> {
		this.selectAllCallback(gridInfo.gridIndex);
		return TPromise.as(true);
	}
}

export class SelectAllMessagesAction extends Action {
	public static ID = 'messages.selectAll';
	public static LABEL = localize('selectAll', 'Select All');

	constructor(
		id: string,
		label: string,
		private selectAllCallback: () => void
	) {
		super(id, label);
	}

	public run(): TPromise<boolean> {
		this.selectAllCallback();
		return TPromise.as(true);
	}
}

export class CopyMessagesAction extends Action {
	public static ID = 'grid.copyMessages';
	public static LABEL = localize('copyMessages', 'Copy');

	constructor(
		id: string,
		label: string
	) {
		super(id, label);
	}

	public run(selectedRange: IRange): TPromise<boolean> {
		let selectedText = selectedRange.text();
		WorkbenchUtils.executeCopy(selectedText);
		return TPromise.as(true);
	}
}
