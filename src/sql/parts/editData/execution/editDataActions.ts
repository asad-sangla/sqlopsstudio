/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, IActionItem, IActionRunner } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IShowQueryResultsEditor } from 'sql/parts/query/common/showQueryResultsEditor';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { EventEmitter } from 'vs/base/common/eventEmitter';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import nls = require('vs/nls');
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

/**
 * Action class that edit data based actions will extend
 */
export abstract class EditDataAction extends Action {

	private static BaseClass = 'queryTaskbarIcon';

	private _classes: string[];

	constructor(protected editor: IShowQueryResultsEditor, id: string, enabledClass: string) {
		super(id);
		this.enabled = true;
		this.setClass(enabledClass);
	}

	/**
	 * This method is executed when the button is clicked.
	 */
	public abstract run(): TPromise<void>;

	protected setClass(enabledClass: string): void {
		this._classes = [];
		this._classes.push(EditDataAction.BaseClass);

		if (enabledClass) {
			this._classes.push(enabledClass);
		}
		this.class = this._classes.join(' ');
	}
}

/**
 * Action class that refreshes the table for an edit data session
 */
export class RefreshTableAction extends EditDataAction {
	private static EnabledClass = 'refreshData';
	public static ID = 'refreshTableAction';

	constructor(editor: IShowQueryResultsEditor,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(editor, RefreshTableAction.ID, RefreshTableAction.EnabledClass);
		this.label = nls.localize('refresh', 'Refresh');
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/**
 * Action class that cancels the refresh data trigger in an edit data session
 */
export class StopRefreshTableAction extends EditDataAction {

	private static EnabledClass = 'cancelRefreshData';
	public static ID = 'stopRefreshAction';

	constructor(editor: IShowQueryResultsEditor,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(editor, StopRefreshTableAction.ID, StopRefreshTableAction.EnabledClass);
		this.enabled = false;
		this.label = nls.localize('stop', 'Stop');
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/**
 * Action class that is tied with ChangeMaxRowsActionItem
 */
export class ChangeMaxRowsAction extends EditDataAction {

	private static EnabledClass = '';
	public static ID = 'changeMaxRowsAction';

	constructor(editor: IShowQueryResultsEditor,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(editor, ChangeMaxRowsAction.ID, undefined);
		this.enabled = false;
		this.class = ChangeMaxRowsAction.EnabledClass;
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/*
 * Action item that handles the dropdown (combobox) that lists the avaliable number of row selections
 * for an edit data session
 */
export class ChangeMaxRowsActionItem extends EventEmitter implements IActionItem {

	public actionRunner: IActionRunner;
	private container: HTMLElement;
	private start: HTMLElement;
	private selectBox: SelectBox;
	private toDispose: IDisposable[];
	private context: any;
	private _options: string[];
	private _currentOptionsIndex: number;

	constructor() {
		super();
		this._options = ['200', '1000', 'all'];
		this._currentOptionsIndex = 1;
		this.toDispose = [];
		this.selectBox = new SelectBox([], -1);
		this._registerListeners();
		this._refreshOptions();
	}

	public render(container: HTMLElement): void {
		this.container = container;
		this.selectBox.render(dom.append(container, $('.configuration.listDatabasesSelectBox')));

	}

	public setActionContext(context: any): void {
		this.context = context;
	}

	public isEnabled(): boolean {
		return true;
	}

	public focus(): void {
		this.start.focus();
	}

	public blur(): void {
		this.container.blur();
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}

	private _refreshOptions(databaseIndex?: number): void {
		this.selectBox.setOptions(this._options, this._currentOptionsIndex);
	}

	private _registerListeners(): void {
		this.toDispose.push(this.selectBox.onDidSelect(databaseName => {
			// TODO hook this up. We will need to inject services into this class
		}));
	}
}
