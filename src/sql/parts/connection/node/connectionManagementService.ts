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
import { QueryInput } from 'sql/parts/query/common/queryInput';
import Event, { Emitter } from 'vs/base/common/event';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import * as vscode from 'vscode';

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: ConnectionManagementEvents[] = [];

	private _serverEvents: { [handle: number]: ConnectionManagementEvents; } = Object.create(null);

	private _onConnectionSwitched: Emitter<vscode.ConnectionInfo>;

	constructor(
		@IConnectionDialogService private connectionDialogService: IConnectionDialogService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
	) {
		this._onConnectionSwitched = new Emitter<vscode.ConnectionInfo>();
	}


	public newConnection(): void {
		this.connectionDialogService.showDialog(this);
	}

	public open(connection: vscode.ConnectionInfo, sideByside: boolean): TPromise<any> {
		return this.editorService.openEditor(this.instantiationService.createInstance(QueryInput, connection), null, sideByside);
	}

	public addConnectionProfile(connection: vscode.ConnectionInfo): void {
		// notify event listeners that a new server was registered
		for (var key in this._serverEvents) {

			// connect using the active editor if available
			let activeEditor = this.editorService.getActiveEditor();
			if (activeEditor !== undefined) {
				let uri = this.getActiveEditorInputResource().toString();
				if (uri !== undefined) {
					this._serverEvents[key].onConnect(uri, connection);
					break;
				}
			}

			// connect globally if no active editor
			this._serverEvents[key].onAddConnectionProfile(connection);
		}
	}

	public get onConnectionSwitched(): Event<vscode.ConnectionInfo> {
		return this._onConnectionSwitched.event;
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

		// Try with Editor Input
		const input = this.editorService.getActiveEditorInput();
		if (input && input instanceof FileEditorInput) {
			return input.getResource();
		}

		return null;
	}
}
