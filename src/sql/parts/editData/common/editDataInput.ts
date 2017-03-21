/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel, ConfirmResult } from 'vs/workbench/common/editor';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import Event, { Emitter } from 'vs/base/common/event';
import URI from 'vs/base/common/uri';

/**
 * Input for the EditDataEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 */
export class EditDataInput extends EditorInput implements IConnectableInput {
	public static ID: string = 'workbench.editorinputs.editDataInput';
	private _visible: boolean;
	private _hasBootstrapped: boolean;
	private _editorContainer: HTMLElement;
	private _updateTaskbar: Emitter<EditDataInput>;
	private _showTableView: Emitter<EditDataInput>;
	private _refreshButtonEnabled: boolean;
	private _stopButtonEnabled: boolean;
	private _setup: boolean;
	private _toDispose: IDisposable[];

	constructor(private _uri: URI, private _tableName,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IQueryModelService private _queryModelService: IQueryModelService
	) {
		super();
		this._visible = false;
		this._hasBootstrapped = false;
		this._updateTaskbar = new Emitter<EditDataInput>();
		this._showTableView = new Emitter<EditDataInput>();
		this._setup = false;
		this._stopButtonEnabled = false;
		this._refreshButtonEnabled = false;
		this._toDispose = [];

		// Attach to event callbacks
		if (this._queryModelService) {
			let self = this;

			// Register callbacks for the Actions
			this._toDispose.push(
				this._queryModelService.onRunQueryStart(uri => {
					if (self.uri === uri) {
						self.initEditStart();
					}
				})
			);

			this._toDispose.push(
				this._queryModelService.onEditSessionReady((result) => {
					if (self.uri === result.ownerUri) {
						self.initEditEnd(result.success);
					}
				})
			);
		}
	}

	// Getters/Setters
	public get tableName(): string { return this._tableName; }
	public get uri(): string { return this._uri.toString(); }
	public get updateTaskbar(): Event<EditDataInput> { return this._updateTaskbar.event; }
	public get showTableView(): Event<EditDataInput> { return this._showTableView.event; }
	public get stopButtonEnabled(): boolean { return this._stopButtonEnabled; }
	public get refreshButtonEnabled(): boolean { return this._refreshButtonEnabled; }
	public get container(): HTMLElement { return this._editorContainer; }
	public get hasBootstrapped(): boolean { return this._hasBootstrapped; }
	public get visible(): boolean { return this._visible; }
	public get setup(): boolean{ return this._setup; }
	public getTypeId(): string { return EditDataInput.ID; }
	public setVisibleTrue(): void { this._visible = true; }
	public setBootstrappedTrue(): void { this._hasBootstrapped = true; }
	public getResource(): URI { return this._uri; }
	public getName(): string { return this._uri.path; }
	public supportsSplitEditor(): boolean { return false; }
	public setupComplete(){ this._setup = true; }
	public set container(container: HTMLElement) {
		this._disposeContainer();
		this._editorContainer = container;
	}

	// State Update Callbacks
	public initEditStart(): void {
		this._refreshButtonEnabled = false;
		this._stopButtonEnabled = true;
		this._updateTaskbar.fire(this);
	}

	public initEditEnd(success: boolean): void {
		if (success) {
			this._refreshButtonEnabled = true;
			this._stopButtonEnabled = false;
		} else {
			this._refreshButtonEnabled = true;
			this._stopButtonEnabled = false;
			// TODO: handle initializeEdit failure and notify user or error
		}
		this._updateTaskbar.fire(this);
	}

	public onConnectStart(): void {
		// TODO: Indicate connection started
	}

	public onConnectReject(): void {
		// TODO: deal with connection failure
	}

	public onConnectSuccess(runQueryOnCompletion: boolean): void {
		this._queryModelService.initializeEdit(this);
		this._showTableView.fire(this);
	}

	public onDisconnect(): void {
		// TODO: deal with disconnections
	}

	// Boiler Plate Functions
	public matches(otherInput: any): boolean {
		if (otherInput instanceof EditDataInput) {
			return (this.uri === otherInput.uri);
		}

		return false;
	}

	public resolve(refresh?: boolean): TPromise<EditorModel> {
		return TPromise.as(null);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
		this._disposeContainer();
		super.dispose();
	}

	private _disposeContainer() {
		if(this._editorContainer && this._editorContainer.parentElement) {
			this._editorContainer.parentElement.removeChild(this._editorContainer)
			this._editorContainer = null;
		}
	}

	public close(): void {
		this._connectionManagementService.disconnectEditor(this, true).then(() => {
			this.dispose();
			super.close();
		});
	}
}
