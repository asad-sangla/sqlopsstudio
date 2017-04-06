/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel, ConfirmResult, EncodingMode, IEncodingSupport } from 'vs/workbench/common/editor';
import { IConnectionManagementService, IConnectableInput, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { IMessageService, Severity } from 'vs/platform/message/common/message';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IDisposable } from 'vs/base/common/lifecycle';
import Event, { Emitter } from 'vs/base/common/event';
import URI from 'vs/base/common/uri';
import { ISelectionData } from 'data';

/**
 * Input for the QueryEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 * and a UntitledEditorInput for the SQL File Editor.
 */
export class QueryInput extends EditorInput implements IEncodingSupport, IConnectableInput {
	public static ID: string = 'workbench.editorinputs.queryInput';
	public static SCHEMA: string = 'sql';
	private _runQueryEnabled: boolean;
	private _cancelQueryEnabled: boolean;
	private _connectEnabled: boolean;
	private _disconnectEnabled: boolean;
	private _changeConnectionEnabled: boolean;
	private _listDatabasesConnected: boolean;
	private _updateTaskbar: Emitter<void>;
	private _showQueryResultsEditor: Emitter<void>;
	private _setup: boolean;
	private _toDispose: IDisposable[];

	constructor(private name: string, private description: string, private _sql: UntitledEditorInput, private _results: QueryResultsInput,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IMessageService private _messageService: IMessageService
	) {
		super();
		let self = this;
		this._setup = false;
		this._updateTaskbar = new Emitter<void>();
		this._showQueryResultsEditor = new Emitter<void>();
		this._toDispose = [];
		// re-emit sql editor events through this editor if it exists
		if (this._sql) {
			this._toDispose.push( this._sql.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
		}

		// Attach to event callbacks
		if (this._queryModelService) {
			// Register callbacks for the Actions
			this._toDispose.push(
					this._queryModelService.onRunQueryStart(uri => {
					if (self.uri === uri) {
						self.onRunQuery();
					}
				})
			);

			this._toDispose.push(
				this._queryModelService.onRunQueryComplete(uri => {
					if (self.uri === uri) {
						self.onQueryComplete();
					}
				})
			);
		}

		if (this._connectionManagementService) {
			this._toDispose.push(self._connectionManagementService.onDisconnect(result => {
				if (result.connectionUri === self.uri) {
					self.onDisconnect();
				}
			}));
		}

		this.onDisconnect();
		this.onQueryComplete();
	}

	// Getters for private properties
	public get uri(): string { return this.getResource().toString(); }
	public get sql(): UntitledEditorInput { return this._sql; }
	public get results(): QueryResultsInput { return this._results; }
	public get updateTaskbar(): Event<void> { return this._updateTaskbar.event; }
	public get showQueryResultsEditorEvent(): Event<void> { return this._showQueryResultsEditor.event; }
	public get runQueryEnabled(): boolean{ return this._runQueryEnabled; }
	public get cancelQueryEnabled(): boolean{ return this._cancelQueryEnabled; }
	public get connectEnabled(): boolean{ return this._connectEnabled; }
	public get disconnectEnabled(): boolean{ return this._disconnectEnabled; }
	public get changeConnectionEnabled(): boolean{ return this._changeConnectionEnabled; }
	public get listDatabasesConnected(): boolean{ return this._listDatabasesConnected; }
	public get setup(): boolean { return this._setup; }
	public setupComplete(): void { this._setup = true; }
	public getQueryResultsInputResource(): string { return this._results.uri; }
	public showQueryResultsEditor(): void { this._showQueryResultsEditor.fire(); }
	public getTypeId(): string { return UntitledEditorInput.ID; }
	public getDescription(): string { return this.description; }
	public supportsSplitEditor(): boolean { return false; }

	public matches(otherInput: any): boolean {
		if (otherInput instanceof QueryInput) {
			return this._sql.matches(otherInput.sql);
		}

		return this._sql.matches(otherInput);
	}

	// Forwarding resource functions to the inline sql file editor
	public get onDidModelChangeContent(): Event<void> { return this._sql.onDidModelChangeContent; }
	public get onDidModelChangeEncoding(): Event<void> { return this._sql.onDidModelChangeEncoding; }
	public resolve(refresh?: boolean): TPromise<EditorModel> { return this._sql.resolve(refresh); }
	public save(): TPromise<boolean> { return this._sql.save(); }
	public isDirty(): boolean { return this._sql.isDirty(); }
	public confirmSave(): ConfirmResult { return this._sql.confirmSave(); }
	public getResource(): URI { return this._sql.getResource(); }
	public getEncoding(): string { return this._sql.getEncoding(); }
	public suggestFileName(): string { return this._sql.suggestFileName(); }
	public getName(): string { return this._sql.getName();}
	public hasAssociatedFilePath(): boolean { return this._sql.hasAssociatedFilePath; }

	public setEncoding(encoding: string, mode: EncodingMode /* ignored, we only have Encode */): void {
		this._sql.setEncoding(encoding, mode);
	}

	// State update funtions
	public runQuery(selection: ISelectionData): void {
		this._queryModelService.runQuery(this.uri, selection, this.uri);
		this.showQueryResultsEditor();
	}

	public onConnectStart(): void {
		this._runQueryEnabled = false;
		this._cancelQueryEnabled = false;
		this._connectEnabled = false;
		this._disconnectEnabled = true;
		this._changeConnectionEnabled = false;
		this._listDatabasesConnected = false;
		this._updateTaskbar.fire();
	}

	public onConnectReject(error?: string): void {
		if (error) {
			this._messageService.show(Severity.Error, error);
		}
		this.onDisconnect();
		this._updateTaskbar.fire();
		this._messageService.show(Severity.Error, error);
	}

	public onConnectSuccess(params?: INewConnectionParams): void {
		this._runQueryEnabled = true;
		this._connectEnabled = false;
		this._disconnectEnabled = true;
		this._changeConnectionEnabled = true;
		this._listDatabasesConnected = true;

		let isRunningQuery = this._queryModelService.isRunningQuery(this.uri);
		if (!isRunningQuery && params && params.runQueryOnCompletion) {
			let selection: ISelectionData = params ? params.querySelection : undefined;
			this.runQuery(selection);
		}
		this._updateTaskbar.fire();
	}

	public onDisconnect(): void {
		this._runQueryEnabled = true;
		this._cancelQueryEnabled = false;
		this._connectEnabled = true;
		this._disconnectEnabled = false;
		this._changeConnectionEnabled = false;
		this._listDatabasesConnected = false;
		this._updateTaskbar.fire();
	}

	public onRunQuery(): void {
		this._runQueryEnabled = false;
		this._cancelQueryEnabled = true;
		this._updateTaskbar.fire();
	}

	public onQueryComplete(): void {
		this._runQueryEnabled = true;
		this._cancelQueryEnabled = false;
		this._updateTaskbar.fire();
	}

	// Clean up functions
	public dispose(): void {
		this._sql.dispose();
		this._results.dispose();
		super.dispose();
	}

	public close(): void {
		this._connectionManagementService.disconnectEditor(this, true);
		this._sql.close();
		this._results.close();
		super.close();
	}
}