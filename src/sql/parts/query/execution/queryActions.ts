/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, IActionItem, IActionRunner } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { EventEmitter } from 'vs/base/common/eventEmitter';
import { IConnectionManagementService, INewConnectionParams, ConnectionType } from 'sql/parts/connection/common/connectionManagement';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import nls = require('vs/nls');
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

/**
 * Action class that query-based Actions will extend. This base class automatically handles activating and
 * deactivating the button when a SQL file is opened.
 */
export abstract class QueryTaskbarAction extends Action {

	public static BaseClass = 'queryTaskbarIcon';

	private _classes: string[];

	constructor(
		protected _connectionManagementService: IConnectionManagementService,
		protected editor: QueryEditor,
		id: string,
		enabledClass: string
	) {
		super(id);
		this.enabled = true;
		this._setCssClass(enabledClass);
	}

	/**
	 * This method is executed when the button is clicked.
	 */
	public abstract run(): TPromise<void>;

	/**
	 * Sets the CSS classes combining the parent and child classes.
	 * Public for testing only.
	 */
	private _setCssClass(enabledClass: string): void {
		this._classes = [];
		this._classes.push(QueryTaskbarAction.BaseClass);

		if (enabledClass) {
			this._classes.push(enabledClass);
		}
		this.class = this._classes.join(' ');
	}

	/**
	 * Returns the URI of the given editor if it is not undefined and is connected.
	 * Public for testing only.
	 */
	public isConnected(editor: QueryEditor): boolean {
		if (!editor || !editor.currentQueryInput) {
			return false;
		}
		return this._connectionManagementService.isConnected(editor.currentQueryInput.uri);
	}

	/**
	 * Connects the given editor to it's current URI.
	 * Public for testing only.
	 */
	protected connectEditor(editor: QueryEditor, runQueryOnCompletion?: boolean): void {
		let params: INewConnectionParams = {
			input: editor.currentQueryInput,
			connectionType: ConnectionType.queryEditor,
			runQueryOnCompletion: runQueryOnCompletion ? runQueryOnCompletion : false,
		};
		this._connectionManagementService.newConnection(params);
	}
}

/**
 * Action class that runs a query in the active SQL text document.
 */
export class RunQueryAction extends QueryTaskbarAction {

	public static EnabledClass = 'runQuery';
	public static ID = 'runQueryAction';

	constructor(
		editor: QueryEditor,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService,
		@IEditorGroupService private editorGroupService: IEditorGroupService
	) {
		super(connectionManagementService, editor, RunQueryAction.ID, RunQueryAction.EnabledClass);
		this.label = nls.localize('runQueryLabel', 'Run Query');
	}

	public run(): TPromise<void> {
		if (this.isConnected(this.editor)) {
			// If we are already connected, run the query
			this.runQuery(this.editor);
		} else {
			// If we are not already connected, prompt for conneciton and run the query if the
			// connection succeeds. "runQueryOnCompletion=true" will cause the query to run after connection
			this.connectEditor(this.editor, true);
		}
		return TPromise.as(null);
	}

	public runQuery(editor: QueryEditor) {
		if (!editor) {
			editor = this.editor;
		}

		if (this.isConnected(editor)) {
			editor.currentQueryInput.runQuery();
		}
	}
}

/**
 * Action class that cancels the running query in the current SQL text document.
 */
export class CancelQueryAction extends QueryTaskbarAction {

	public static EnabledClass = 'cancelQuery';
	public static ID = 'cancelQueryAction';

	constructor(
		editor: QueryEditor,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
	) {
		super(connectionManagementService, editor, CancelQueryAction.ID, CancelQueryAction.EnabledClass);
		this.enabled = false;
		this.label = nls.localize('cancelQueryLabel', 'Cancel Query');
	}

	public run(): TPromise<void> {
		if (this.isConnected(this.editor)) {
			this._queryModelService.cancelQuery(this.editor.currentQueryInput.uri);
		}
		return TPromise.as(null);
	}
}

/**
 * Action class that disconnects the connection associated with the current query file.
 */
export class DisconnectDatabaseAction extends QueryTaskbarAction {

	public static EnabledClass = 'disconnectDatabase';
	public static ID = 'disconnectDatabaseAction';

	constructor(
		editor: QueryEditor,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
	) {
		super(connectionManagementService, editor, DisconnectDatabaseAction.ID, DisconnectDatabaseAction.EnabledClass);
		this.label = nls.localize('disconnectDatabaseLabel', 'Disconnect');
	}

	public run(): TPromise<void> {
		// Call disconnectEditor regardless of the connection state and let the ConnectionManagementService
		// determine if we need to disconnect, cancel an in-progress conneciton, or do nothing
		this._connectionManagementService.disconnectEditor(this.editor.currentQueryInput);
		return TPromise.as(null);
	}
}

/**
 * Action class that launches a connection dialogue for the current query file
 */
export class ConnectDatabaseAction extends QueryTaskbarAction {

	public static EnabledDefaultClass = 'connectDatabase';
	public static EnabledChangeClass = 'changeConnectionDatabase';
	public static ID = 'connectDatabaseAction';

	constructor(
		editor: QueryEditor,
		isChangeConnectionAction: boolean,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
	) {
		let enabledClass: string = ConnectDatabaseAction.EnabledDefaultClass;
		if (isChangeConnectionAction) {
			enabledClass = ConnectDatabaseAction.EnabledChangeClass;
		}

		super(connectionManagementService, editor, ConnectDatabaseAction.ID, enabledClass);
		this.label = nls.localize('connectDatabaseLabel', 'Connect');
	}

	public run(): TPromise<void> {
		this.connectEditor(this.editor);
		return TPromise.as(null);
	}
}

/**
 * Action class that is tied with ListDatabasesActionItem.
 */
export class ListDatabasesAction extends QueryTaskbarAction {

	public static EnabledClass = '';
	public static ID = 'listDatabaseQueryAction';

	constructor(
		editor: QueryEditor,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
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
	public static ID = 'listDatabaseQueryActionItem';

	public actionRunner: IActionRunner;
	private container: HTMLElement;
	private selectBox: SelectBox;
	private toDispose: IDisposable[];
	private context: any;
	private _databases: string[];
	private _currentDatabaseName: string;
	private _isConnected: boolean;

	constructor(
		private editor: QueryEditor,
		private action: ListDatabasesAction,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IQueryModelService private _queryModelService: IQueryModelService) {
		super();
		this.toDispose = [];
		this.selectBox = new SelectBox([], -1);
		this._databases = [];
		this._registerListeners();
	}

	public render(container: HTMLElement): void {
		this.container = container;
		this.selectBox.render(dom.append(container, $('.configuration.listDatabasesSelectBox')));
	}

	public setActionContext(context: any): void {
		this.context = context;
	}

	public isEnabled(): boolean {
		return !!this._isConnected;
	}

	public focus(): void {
		this.selectBox.focus();
	}

	public blur(): void {
		this.container.blur();
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}

	public onConnected(): void {
		let dbName = this._getCurrentDatabaseName();
		this.updateConnection(dbName);
	}

	public onConnectionChanged(updatedConnection: IConnectionProfile): void {
		if (updatedConnection) {
			this.updateConnection(updatedConnection.databaseName);
		}
	}

	private updateConnection(databaseName: string) {
		this._isConnected = true;
		// TODO: query the connection service for a cached list of databases on the server
		this._databases = [];
		this._currentDatabaseName = databaseName;
		if (this._currentDatabaseName) {
			this._databases.push(this._currentDatabaseName);
		}
		this._refreshDatabaseList();
	}

	public onDisconnect(): void {
		this._isConnected = false;
		this._currentDatabaseName = undefined;
		this._databases = [];
		this._refreshDatabaseList();
	}

	private _refreshDatabaseList(): void {
		// Use object copy to ensure that we update the list of options in the
		// selectedElement. Otherwise may fail to refresh the list
		let dbs = this._databases.slice();
		// Get selected index - will return -1 if not found
		let selected = this._databases.indexOf(this._currentDatabaseName);
		this.selectBox.setOptions(dbs, selected);
	}

	private _registerListeners(): void {
		let self = this;
		this.toDispose.push(this.selectBox.onDidSelect(databaseName => {
			// TODO hook this up. We will need to inject services into this class
		}));
		this.toDispose.push(this._connectionManagementService.onConnectionChanged((connChanged) => {
			let uri = self._getConnectedQueryEditorUri(self.editor);
			if (uri && uri === connChanged.connectionUri) {
				self.onConnectionChanged(connChanged.connectionInfo);
			}
		}));
	}

	private _getCurrentDatabaseName() {
		let uri = this._getConnectedQueryEditorUri(this.editor);
		if (uri) {
			let profile = this._connectionManagementService.getConnectionProfile(uri);
			if (profile) {
				return profile.databaseName;
			}
		}
		return undefined;
	}

	/**
	 * Returns the URI of the given editor if it is not undefined and is connected.
	 */
	private _getConnectedQueryEditorUri(editor: QueryEditor): string {
		if (!editor || !editor.uri) {
			return undefined;
		}
		return this._connectionManagementService.isConnected(editor.uri) ? editor.uri : undefined;
	}


	// TESTING PROPERTIES ////////////////////////////////////////////////////////////
	public get currentDatabaseName(): string {
		return this._currentDatabaseName;
	}

	/**
	 * public for testing purposes only
	 */
	public _setSelectBox(box: SelectBox): void {
		this.selectBox = box;
	}

}
