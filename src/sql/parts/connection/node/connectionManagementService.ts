/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import URI from 'vs/base/common/uri';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IConnectionManagementService, ConnectionManagementEvents, IConnectionDialogService } from 'sql/parts/connection/common/connectionManagement';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import { IStatusbarService } from 'vs/platform/statusbar/common/statusbar';
// import { ConnectionStore } from './connectionStore';
import { Memento } from 'vs/workbench/common/memento';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import * as vscode from 'vscode';

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: ConnectionManagementEvents[] = [];

	private _serverEvents: { [handle: number]: ConnectionManagementEvents; } = Object.create(null);

	// private _connectionStore: ConnectionStore;

	private connectionMemento: Memento;


	constructor(
		@IConnectionDialogService private _connectionDialogService: IConnectionDialogService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IStatusbarService private _statusService: IStatusbarService,
		@IWorkspaceContextService private _contextService: IWorkspaceContextService,
		@IStorageService private _storageService: IStorageService,
		@ITelemetryService private _telemetryService: ITelemetryService
	) {

		this.connectionMemento = new Memento('ConnectionManagement');

		// this._connectionStore = new ConnectionStore(_storageService, this.connectionMemento);


	}


	public newConnection(): void {
		this._connectionDialogService.showDialog(this);
	}

	public addConnectionProfile(connection: vscode.ConnectionInfo): void {
		this._statusService.setStatusMessage('Connecting...');

		this.saveToSettings(connection);

		this.connect(connection);
	}

	private connect(connection: vscode.ConnectionInfo): void {
		for (var key in this._serverEvents) {
			let uri = this.getActiveEditorUri();
			if (this.getActiveEditorUri() !== undefined) {
				this._serverEvents[key].onConnect(uri, connection);
			} else {
				this._serverEvents[key].onAddConnectionProfile(connection);
			}
		}
	}

	private getActiveEditorUri(): string {
		let uri: string = undefined;
		let activeEditor = this._editorService.getActiveEditor();
		if (activeEditor !== undefined) {
			uri = this.getActiveEditorInputResource().toString();
		}
		return undefined;
	}

	private saveToSettings(connection: vscode.ConnectionInfo): boolean {


		return true;
	}

	public onConnectionComplete(handle: number, connectionUri: string): void {
		this._statusService.setStatusMessage('Updating IntelliSense cache');
	}

	public onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._statusService.setStatusMessage('Connection Complete ' + connectionUri);
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public addEventListener(handle: number, serverEvents: ConnectionManagementEvents): IDisposable {
		this._providers.push(serverEvents);

		this._serverEvents[handle] = serverEvents;

		return {
			dispose: () => {
			}
		};
	}

	private getActiveEditorInputResource(): URI {
		const input = this._editorService.getActiveEditorInput();
		if (input && input instanceof FileEditorInput) {
			return input.getResource();
		}

		return null;
	}
}
