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
import { IConnectionManagementService, INewConnectionParams, ConnectionType, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { IBootstrapService } from 'sql/parts/bootstrap/bootstrapService';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IDbListInterop } from 'sql/parts/common/dblist/dbListInterop';
import { DbListComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import { DbListModule, GetUniqueDbListUri, DBListAngularSelectorString } from 'sql/parts/common/dblist/dblist.module';
import { ISelectionData } from 'data';
import nls = require('vs/nls');
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

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
	protected connectEditor(editor: QueryEditor, runQueryOnCompletion?: boolean, selection?: ISelectionData): void {
		let params: INewConnectionParams = {
			input: editor.currentQueryInput,
			connectionType: ConnectionType.editor,
			runQueryOnCompletion: runQueryOnCompletion ? runQueryOnCompletion : false,
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
		this.label = nls.localize('runQueryLabel', 'Run Query');
	}

	public run(): TPromise<void> {
		if (this.isConnected(this.editor)) {
			// If we are already connected, run the query
			this.runQuery(this.editor);
		} else {
			// If we are not already connected, prompt for conneciton and run the query if the
			// connection succeeds. "runQueryOnCompletion=true" will cause the query to run after connection
			this.connectEditor(this.editor, true, this.editor.getSelection());
		}
		return TPromise.as(null);
	}

	public runQuery(editor: QueryEditor) {
		if (!editor) {
			editor = this.editor;
		}

		if (this.isConnected(editor)) {
			editor.currentQueryInput.runQuery(editor.getSelection());
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
export class ListDatabasesActionItem extends EventEmitter implements IActionItem, IDbListInterop {
	public static ID = 'listDatabaseQueryActionItem';

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _onDatabaseChanged = new Emitter<string>();

	public actionRunner: IActionRunner;
	private container: HTMLElement;
	private toDispose: IDisposable[];
	private context: any;
	private _currentDatabaseName: string;
	private _isConnected: boolean;

	// EVENTS /////////////////////////////////////////////////////////////
	public get onDatabaseChanged(): Event<string> { return this._onDatabaseChanged.event; }

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		private editor: QueryEditor,
		private action: ListDatabasesAction,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IBootstrapService private _bootstrapService: IBootstrapService,
		@IMessageService private _messageService: IMessageService) {
		super();
		this.toDispose = [];
	}

	public render(container: HTMLElement): void {
		this.container = container;

		// Get the bootstrap params and perform the bootstrap
		let params: DbListComponentParams = { dbListInterop: this };
		this._bootstrapService.bootstrap(
			DbListModule,
			container,
			DBListAngularSelectorString,
			GetUniqueDbListUri(),
			params);
	}

	public setActionContext(context: any): void {
		this.context = context;
	}

	public isEnabled(): boolean {
		return !!this._isConnected;
	}

	public focus(): void {
		this.container.focus();
	}

	public blur(): void {
		this.container.blur();
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
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

	public lookupUri(id: string): string {
		return this.editor ? this.editor.uri : undefined;
	}

	public databaseSelected(dbName: string): void {
		let self = this;
		let uri = this._getConnectedQueryEditorUri(this.editor);
		if (uri) {
			let profile = this._connectionManagementService.getConnectionProfile(uri);
			if (profile) {
				this._connectionManagementService.changeDatabase(this.editor.uri, dbName).then(result => {
					if (!result) {
						// Change database failed. Ideally would revert to original, but for now reflect actual
						// behavior by notifying of a disconnect. Note: we should ideally handle this via global notification
						// to simplify control flow
						self._showChangeDatabaseFailed();
					}
				}, error => {
						self._showChangeDatabaseFailed();
				});
			}
		}
	}

	private _showChangeDatabaseFailed() {
		this.onDisconnect();
		this._messageService.show(Severity.Error, 'Failed to change database');
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

	// TESTING PROPERTIES ////////////////////////////////////////////////////////////
	public get currentDatabaseName(): string {
		return this._currentDatabaseName;
	}

}
