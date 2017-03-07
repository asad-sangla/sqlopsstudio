/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, IActionItem, IActionRunner } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IShowQueryResultsEditor, isInstanceOfIQueryEditor } from 'sql/parts/query/editor/showQueryResultsEditor';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { EventEmitter } from 'vs/base/common/eventEmitter';
import nls = require('vs/nls');
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

/**
 * Action class that query-based Actions will extend. This base class automatically handles activating and
 * deactivating the button when a SQL file is opened.
 */
export abstract class QueryTaskbarAction extends Action {

	private static BaseClass = 'queryTaskbarIcon';

	private _classes: string[];

	constructor(id: string, enabledClass: string) {
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
		this._classes.push(QueryTaskbarAction.BaseClass);

		if (enabledClass) {
			this._classes.push(enabledClass);
		}
		this.class = this._classes.join(' ');
	}
}

/**
 * Action class that runs a query in the active SQL text document.
 */
export class RunQueryAction extends QueryTaskbarAction {

	private static EnabledClass = 'runQuery';
	public static ID = 'runQueryAction';


	constructor(private _editorService: IWorkbenchEditorService, private _queryModelService: IQueryModelService) {
		super(RunQueryAction.ID, RunQueryAction.EnabledClass);
		this.label = nls.localize('runQueryLabel', 'Run Query');
	}

	public run(): TPromise<void> {
		let activeEditor = this._editorService.getActiveEditor();

		if (activeEditor && isInstanceOfIQueryEditor(activeEditor)) {
			let editor: IShowQueryResultsEditor = <IShowQueryResultsEditor>activeEditor;
			let uri: string = editor.uri;

			this._queryModelService.runQuery(uri, undefined, uri);
			editor.showQueryResultsEditor();
			this._queryModelService.TEST_sendDummyQueryEvents(uri);
		} else {
			throw new Error('Run Query button activated but active editor is not of type QueryEditor');
		}

		return TPromise.as(null);
	}
}

/**
 * Action class that cancels the running query in the current SQL text document.
 */
export class CancelQueryAction extends QueryTaskbarAction {

	private static EnabledClass = 'cancelQuery';
	public static ID = 'cancelQueryAction';


	constructor(private _editorService: IWorkbenchEditorService, private _queryModelService: IQueryModelService) {
		super(CancelQueryAction.ID, CancelQueryAction.EnabledClass);
		this.enabled = false;
		this.label = nls.localize('cancelQueryLabel', 'Cancel Query');
	}

	public run(): TPromise<void> {
		let activeEditor = this._editorService.getActiveEditor();

		if (activeEditor && isInstanceOfIQueryEditor(activeEditor)) {
			let editor: IShowQueryResultsEditor = <IShowQueryResultsEditor>activeEditor;
			let uri: string = editor.uri;
			this._queryModelService.cancelQuery(uri);
		}

		return TPromise.as(null);
	}
}

/**
 * Action class that disconnects the connection associated with the current query file.
 */
export class DisconnectDatabaseAction extends QueryTaskbarAction {

	private static EnabledClass = 'disconnectDatabase';
	public static ID = 'disconnectDatabaseAction';

	constructor() {
		super(CancelQueryAction.ID, DisconnectDatabaseAction.EnabledClass);
		this.label = nls.localize('disconnectDatabaseLabel', 'Disconnect');
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/**
 * Action class that launches a connection dialogue for the current query file
 */
export class ConnectDatabaseAction extends QueryTaskbarAction {

	private static EnabledClass = 'connectDatabase';
	public static ID = 'connectDatabaseAction';

	constructor() {
		super(CancelQueryAction.ID, ConnectDatabaseAction.EnabledClass);
		this.label = nls.localize('connectDatabaseLabel', 'Connect');
	}

	public run(): TPromise<void> {
		// TODO hook this up
		return TPromise.as(null);
	}
}

/**
 * Action class that launches a connection dialogue for the current query file
 */
export class ChangeConnectionAction extends QueryTaskbarAction {

	private static EnabledClass = 'changeConnectionDatabase';
	public static ID = 'changeConnectionDatabaseAction';

	constructor() {
		super(CancelQueryAction.ID, ChangeConnectionAction.EnabledClass);
		this.label = nls.localize('changeConnectionDatabaseLabel', 'Change Connection');
	}

	public run(): TPromise<void> {
		// TODO hook this up
		return TPromise.as(null);
	}
}

/**
 * Action class that is tied with ListDatabasesActionItem.
 */
export class ListDatabasesAction extends QueryTaskbarAction {

	private static EnabledClass = '';
	public static ID = 'listDatabaseQueryAction';

	constructor() {
		super(ListDatabasesAction.ID, undefined);
		this.enabled = false;
		this.class = ListDatabasesAction.EnabledClass;
	}

	public run(): TPromise<void> {
		// TODO hook this up
		return TPromise.as(null);
	}
}

/*
 * Action item that handles the dropdown (combobox) that lists the available databases.
 * Based off StartDebugActionItem.
 */
export class ListDatabasesActionItem extends EventEmitter implements IActionItem {

	private static testDatabaseList: string[] = ['master', 'testdb', 'anotherTest', 'aVeryLongDatabaseName'];

	public actionRunner: IActionRunner;
	private container: HTMLElement;
	private start: HTMLElement;
	private selectBox: SelectBox;
	private toDispose: IDisposable[];
	private context: any;
	private _databases: string[];
	private _currentDatabaseIndex: number;

	constructor() {
		super();
		this._databases = [];
		this._currentDatabaseIndex = 0;
		this.toDispose = [];
		this.selectBox = new SelectBox([], -1);
		this._registerListeners();

		this._databases = ListDatabasesActionItem.testDatabaseList;
		this._refreshDatabaseList();
	}

	public render(container: HTMLElement): void {
		this.container = container;
		this.selectBox.render(dom.append(container, $('.configuration')));
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

	private _refreshDatabaseList(databaseIndex?: number): void {
		this.selectBox.setOptions(this._databases, this._currentDatabaseIndex);
	}

	private _registerListeners(): void {
		this.toDispose.push(this.selectBox.onDidSelect(databaseName => {
			// TODO hook this up. We will need to inject services into this class
		}));
	}
}
