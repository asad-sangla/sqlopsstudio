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
import { IConnectionManagementService, INewConnectionParams, ConnectionType } from 'sql/parts/connection/common/connectionManagement';
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

	constructor(
		protected _connectionManagementService: IConnectionManagementService,
		protected editor: IShowQueryResultsEditor,
		id: string,
		enabledClass: string
	) {
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

	/**
	 * Returns the URI of the given editor if it is not undefined and is connected.
	 */
	protected getConnectedQueryEditorUri(editor: IShowQueryResultsEditor): string {
		if (!editor || !editor.uri) {
			return undefined;
		}
		return this._connectionManagementService.isConnected(editor.uri) ? editor.uri : undefined;
	}

	/**
	 * Connects the given editor to it's current URI.
	 */
	protected connectEditor(editor: IShowQueryResultsEditor, uri: string, runQueryOnCompletion: boolean): void {
		let params: INewConnectionParams = {
			editor: editor,
			connectionType: ConnectionType.queryEditor,
			uri: uri ? uri : editor.uri,
			runQueryOnCompletion: runQueryOnCompletion
		};
		this._connectionManagementService.newConnection(params);
	}
}

/**
 * Action class that runs a query in the active SQL text document.
 */
export class RunQueryAction extends QueryTaskbarAction {

	private static EnabledClass = 'runQuery';
	public static ID = 'runQueryAction';

	constructor(
		private _queryModelService: IQueryModelService,
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, RunQueryAction.ID, RunQueryAction.EnabledClass);
		this.label = nls.localize('runQueryLabel', 'Run Query');
	}

	public run(): TPromise<void> {
		let uri = this.getConnectedQueryEditorUri(this.editor);

		if (uri) {
			// If we are already connected, run the query
			this.runQuery(this.editor, uri);
		} else {
			// If we are not already connected, prompt for conneciton and run the query if the
			// connection succeeds. "runQueryOnCompletion=true" will cause the query to run after connection
			this.connectEditor(this.editor, uri, true);
		}
		return TPromise.as(null);
	}

	public runQuery(editor?: IShowQueryResultsEditor, uri?: string) {
		if (!editor) {
			editor = this.editor;
		}
		if (!uri) {
			uri = this.getConnectedQueryEditorUri(editor);
		}
		if (uri) {
			this._queryModelService.runQuery(uri, undefined, uri);
			editor.showQueryResultsEditor();
		}
	}
}

/**
 * Action class that cancels the running query in the current SQL text document.
 */
export class CancelQueryAction extends QueryTaskbarAction {

	private static EnabledClass = 'cancelQuery';
	public static ID = 'cancelQueryAction';

	constructor(
		private _queryModelService: IQueryModelService,
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, CancelQueryAction.ID, CancelQueryAction.EnabledClass);
		this.enabled = false;
		this.label = nls.localize('cancelQueryLabel', 'Cancel Query');
	}

	public run(): TPromise<void> {
		let uri = this.getConnectedQueryEditorUri(this.editor);
		if (uri) {
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

	constructor(
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, CancelQueryAction.ID, DisconnectDatabaseAction.EnabledClass);
		this.label = nls.localize('disconnectDatabaseLabel', 'Disconnect');
	}

	public run(): TPromise<void> {
		let uri = this.getConnectedQueryEditorUri(this.editor);

		if (uri) {
			this._connectionManagementService.disconnectEditor(this.editor, uri);
		}
		return TPromise.as(null);
	}
}

/**
 * Action class that launches a connection dialogue for the current query file
 */
export class ConnectDatabaseAction extends QueryTaskbarAction {

	private static EnabledClass = 'connectDatabase';
	public static ID = 'connectDatabaseAction';

	constructor(
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, CancelQueryAction.ID, ConnectDatabaseAction.EnabledClass);
		this.label = nls.localize('connectDatabaseLabel', 'Connect');
	}

	public run(): TPromise<void> {
		let uri = this.getConnectedQueryEditorUri(this.editor);
		if (!uri) {
			this.connectEditor(this.editor, uri, false);
		}
		return TPromise.as(null);
	}
}

/**
 * Action class that launches a connection dialogue for the current query file
 */
export class ChangeConnectionAction extends QueryTaskbarAction {

	private static EnabledClass = 'changeConnectionDatabase';
	public static ID = 'changeConnectionDatabaseAction';

	constructor(
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, CancelQueryAction.ID, ChangeConnectionAction.EnabledClass);
		this.label = nls.localize('changeConnectionDatabaseLabel', 'Change Connection');
	}

	public run(): TPromise<void> {
		let uri = this.getConnectedQueryEditorUri(this.editor);
		if (uri) {
			// Wait for the current connection to disconnect, then connect
			this._connectionManagementService.disconnectEditor(this.editor, uri).then(didDisconnect => {
				if (didDisconnect) {
					this.connectEditor(this.editor, uri, false);
				}
			});
		}
		return TPromise.as(null);
	}
}

/**
 * Action class that is tied with ListDatabasesActionItem.
 */
export class ListDatabasesAction extends QueryTaskbarAction {

	private static EnabledClass = '';
	public static ID = 'listDatabaseQueryAction';

	constructor(
		connectionManagementService: IConnectionManagementService,
		editor: IShowQueryResultsEditor
	) {
		super(connectionManagementService, editor, ListDatabasesAction.ID, undefined);
		this.enabled = false;
		this.class = ListDatabasesAction.EnabledClass;
	}

	public run(): TPromise<void> {
		return TPromise.as(null);
	}
}

/*
 * Action item that handles the dropdown (combobox) that lists the available databases.
 * Based off StartDebugActionItem.
 */
export class ListDatabasesActionItem extends EventEmitter implements IActionItem {

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

		this._databases = [];
		this._refreshDatabaseList();
	}

	public render(container: HTMLElement): void {
		this.container = container;
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
