/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IRegisteredServersService, RegisteredServersEvents, IConnectionDialogService } from 'sql/parts/connection/common/registeredServers';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import Event, { Emitter } from 'vs/base/common/event';
import * as vscode from 'vscode';

export class RegisteredServersService implements IRegisteredServersService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: RegisteredServersEvents[] = [];

	private _serverEvents: { [handle: number]: RegisteredServersEvents; } = Object.create(null);

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

	public addRegisteredServer(connection: vscode.ConnectionInfo): void {
		// notify event listeners that a new server was registered
		for (var key in this._serverEvents) {
			this._serverEvents[key].onAddRegisteredServer(connection);
		}
	}

	public get onConnectionSwitched(): Event<vscode.ConnectionInfo> {
		return this._onConnectionSwitched.event;
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public addEventListener(handle: number, serverEvents: RegisteredServersEvents): IDisposable {
		this._providers.push(serverEvents);

		this._serverEvents[handle] = serverEvents;

		return {
			dispose: () => {
			}
		};
	}
}
