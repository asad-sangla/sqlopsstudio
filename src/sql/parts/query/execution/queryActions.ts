/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action, IActionItem, IActionRunner } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import Event, { Emitter } from 'vs/base/common/event';
import { EventEmitter } from 'vs/base/common/eventEmitter';
import { IMessageService, Severity } from 'vs/platform/message/common/message';
import {
	IConnectionManagementService, INewConnectionParams, ConnectionType,
	RunQueryOnConnectionMode } from 'sql/parts/connection/common/connectionManagement';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { DBLIST_SELECTOR } from 'sql/parts/common/dblist/dblist.component';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IDbListInterop } from 'sql/parts/common/dblist/dbListInterop';
import { DbListComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { DbListModule } from 'sql/parts/common/dblist/dblist.module';
import { ISelectionData } from 'data';
import nls = require('vs/nls');
import { TextResourceEditor } from 'vs/workbench/browser/parts/editor/textResourceEditor';
import { IEditor } from 'vs/editor/common/editorCommon';
import { Selection } from 'vs/editor/common/core/selection';

declare let AngularPlatformBrowserDynamic;

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

	protected updateCssClass(enabledClass: string): void {
		// set the class, useful on change of label or icon
		this._setCssClass(enabledClass);
	}

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
	protected connectEditor(editor: QueryEditor, runQueryOnCompletion?: RunQueryOnConnectionMode, selection?: ISelectionData): void {
		let params: INewConnectionParams = {
			input: editor.currentQueryInput,
			connectionType: ConnectionType.editor,
			runQueryOnCompletion: runQueryOnCompletion ? runQueryOnCompletion : RunQueryOnConnectionMode.none,
			querySelection: selection
		};
		this._connectionManagementService.showConnectionDialog(params);
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
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
	) {
		super(connectionManagementService, editor, RunQueryAction.ID, RunQueryAction.EnabledClass);
		this.label = nls.localize('runQueryLabel', 'Run');
	}

	public run(): TPromise<void> {
		if (!this.editor.isSelectionEmpty()) {
			if (this.isConnected(this.editor)) {
				// If we are already connected, run the query
				this.runQuery(this.editor);
			} else {
				// If we are not already connected, prompt for connection and run the query if the
				// connection succeeds. "runQueryOnCompletion=true" will cause the query to run after connection
				this.connectEditor(this.editor, RunQueryOnConnectionMode.executeQuery, this.editor.getSelection());
			}
		}
		return TPromise.as(null);
	}

	public runCurrent(): TPromise<void> {
		if (!this.editor.isSelectionEmpty()) {
			if (this.isConnected(this.editor)) {
				// If we are already connected, run the query
				this.runQuery(this.editor, true);
			} else {
				// If we are not already connected, prompt for connection and run the query if the
				// connection succeeds. "runQueryOnCompletion=true" will cause the query to run after connection
				this.connectEditor(this.editor, RunQueryOnConnectionMode.executeCurrentQuery, this.editor.getSelection(false));
			}
		}
		return TPromise.as(null);
	}

	public runQuery(editor: QueryEditor, runCurrentStatement: boolean = false) {
		if (!editor) {
			editor = this.editor;
		}

		if (this.isConnected(editor)) {
			// if the selection isn't empty then execute the selection
			// otherwise, either run the statement or the script depending on parameter
			let selection: ISelectionData = editor.getSelection(false);
			if (runCurrentStatement && selection && this.isCursorPosition(selection)) {
				editor.currentQueryInput.runQueryStatement(selection);
			} else {
				// get the selection again this time with trimming
				selection = editor.getSelection();
				editor.currentQueryInput.runQuery(selection);
			}
		}
	}

	private isCursorPosition(selection: ISelectionData) {
		return selection.startLine === selection.endLine
			&& selection.startColumn === selection.endColumn;
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
		this.label = nls.localize('cancelQueryLabel', 'Cancel');
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
		let label: string;
		let enabledClass: string;

		if (isChangeConnectionAction) {
			enabledClass = ConnectDatabaseAction.EnabledChangeClass;
			label = nls.localize('changeConnectionDatabaseLabel', 'Change Connection');
		} else {
			enabledClass = ConnectDatabaseAction.EnabledDefaultClass;
			label = nls.localize('connectDatabaseLabel', 'Connect');
		}

		super(connectionManagementService, editor, ConnectDatabaseAction.ID, enabledClass);

		this.label = label;
	}

	public run(): TPromise<void> {
		this.connectEditor(this.editor);
		return TPromise.as(null);
	}
}

/**
 * Action class that either launches a connection dialogue for the current query file,
 * or disconnects the active connection
 */
export class ToggleConnectDatabaseAction extends QueryTaskbarAction {

	public static ConnectClass = 'connectDatabase';
	public static DisconnectClass = 'disconnectDatabase';
	public static ID = 'toggleConnectDatabaseAction';

	private _connected: boolean;
	private _connectLabel: string;
	private _disconnectLabel: string;
	constructor(
		editor: QueryEditor,
		isConnected: boolean,
		@IConnectionManagementService connectionManagementService: IConnectionManagementService
	) {
		let label: string;
		let enabledClass: string;

		super(connectionManagementService, editor, ToggleConnectDatabaseAction.ID, enabledClass);

		this._connectLabel = nls.localize('connectDatabaseLabel', 'Connect');
		this._disconnectLabel = nls.localize('disconnectDatabaseLabel', 'Disconnect');

		this.connected = isConnected;
	}

	public get connected(): boolean {
		return this._connected;
	}

	public set connected(value: boolean) {
		// intentionally always updating, since parent class handles skipping if values
		this._connected = value;
		this.updateLabelAndIcon();
	}

	private updateLabelAndIcon(): void {
		if (this._connected) {
			// We are connected, so show option to disconnect
			this.label = this._disconnectLabel;
			this.updateCssClass(ToggleConnectDatabaseAction.DisconnectClass);
		} else {
			this.label = this._connectLabel;
			this.updateCssClass(ToggleConnectDatabaseAction.ConnectClass);
		}
	}

	public run(): TPromise<void> {
		if (this.connected) {
			// Call disconnectEditor regardless of the connection state and let the ConnectionManagementService
			// determine if we need to disconnect, cancel an in-progress connection, or do nothing
			this._connectionManagementService.disconnectEditor(this.editor.currentQueryInput);
		} else {
			this.connectEditor(this.editor);
		}
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
export class ListDatabasesActionItem extends EventEmitter implements IActionItem, IDbListInterop {
	public static ID = 'listDatabaseQueryActionItem';

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _onDatabaseChanged = new Emitter<string>();

	public actionRunner: IActionRunner;
	private _container: HTMLElement;
	private _toDispose: IDisposable[];
	private _context: any;
	private _currentDatabaseName: string;
	private _isConnected: boolean;

	// EVENTS /////////////////////////////////////////////////////////////
	public get onDatabaseChanged(): Event<string> { return this._onDatabaseChanged.event; }

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		private _editor: QueryEditor,
		private _action: ListDatabasesAction,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IBootstrapService private _bootstrapService: IBootstrapService,
		@IMessageService private _messageService: IMessageService) {
		super();
		this._toDispose = [];
	}

	public render(container: HTMLElement): void {
		this._container = container;

		// Get the bootstrap params and perform the bootstrap
		// Note: no need to dispose this since it's expected to live
		// for the life of the app, and it's not input-specific
		let params: DbListComponentParams = { dbListInterop: this };
		this._bootstrapService.bootstrap(
			DbListModule,
			container,
			DBLIST_SELECTOR,
			params);
	}

	public setActionContext(context: any): void {
		this._context = context;
	}

	public isEnabled(): boolean {
		return !!this._isConnected;
	}

	public focus(): void {
		this._container.focus();
	}

	public blur(): void {
		this._container.blur();
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	/**
	 * Returns the URI of the given editor if it is not undefined and is connected.
	 */
	private getConnectedQueryEditorUri(editor: QueryEditor): string {
		if (!editor || !editor.uri) {
			return undefined;
		}
		return this._connectionManagementService.isConnected(editor.uri) ? editor.uri : undefined;
	}

	public lookupUri(id: string): string {
		return this._editor ? this._editor.uri : undefined;
	}

	public databaseSelected(dbName: string): void {
		let self = this;
		let uri = this.getConnectedQueryEditorUri(this._editor);
		if (uri) {
			let profile = this._connectionManagementService.getConnectionProfile(uri);
			if (profile) {
				this._connectionManagementService.changeDatabase(this._editor.uri, dbName).then(result => {
					if (!result) {
						// Change database failed. Ideally would revert to original, but for now reflect actual
						// behavior by notifying of a disconnect. Note: we should ideally handle this via global notification
						// to simplify control flow
						self.showChangeDatabaseFailed();
					}
				}, error => {
						self.showChangeDatabaseFailed();
				});
			}
		}
	}

	private showChangeDatabaseFailed() {
		this.onDisconnect();
		this._messageService.show(Severity.Error, 'Failed to change database');
	}

	public onConnected(): void {
		let dbName = this.getCurrentDatabaseName();
		this.updateConnection(dbName);
	}

	public onConnectionChanged(updatedConnection: IConnectionProfile): void {
		if (updatedConnection) {
			this.updateConnection(updatedConnection.databaseName);
		}
	}

	private updateConnection(databaseName: string) {
		this._isConnected = true;
		this._currentDatabaseName = databaseName;
		if (this._currentDatabaseName) {
		}
		this._onDatabaseChanged.fire(databaseName);
	}

	public onDisconnect(): void {
		this._isConnected = false;
		this._currentDatabaseName = undefined;
		this._onDatabaseChanged.fire(undefined);
	}

	private getCurrentDatabaseName() {
		let uri = this.getConnectedQueryEditorUri(this._editor);
		if (uri) {
			let profile = this._connectionManagementService.getConnectionProfile(uri);
			if (profile) {
				return profile.databaseName;
			}
		}
		return undefined;
	}

	// TESTING PROPERTIES ////////////////////////////////////////////////////////////
	public get currentDatabaseName(): string {
		return this._currentDatabaseName;
	}

}
