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
import { IConnection, IRegisteredServersService, RegisteredServersEvents, IConnectionDialogService } from 'sql/parts/connection/common/registeredServers';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import Event, { Emitter } from 'vs/base/common/event';
import vscode = require('vscode');

class Connection implements IConnection {

	public disabledGlobally = false;
	public disabledForWorkspace = false;

	constructor() { }

	get name(): string {
		return "Connection Name";
	}

	get displayName(): string {
		return "Connection Display Name";
	}
}

export class RegisteredServersService implements IRegisteredServersService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: RegisteredServersEvents[] = [];

	private _serverEvents: { [handle: number]: RegisteredServersEvents; } = Object.create(null);

	private _onConnectionSwitched: Emitter<IConnection>;


	constructor(
		@IConnectionDialogService private connectionDialogService: IConnectionDialogService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService
	) {
		this._onConnectionSwitched = new Emitter<IConnection>();
	}

	public getConnections(): TPromise<IConnection[]> {
		let connections = [];

		for (var i = 0; i < 25; ++i) {
			connections[i] = new Connection();
		}

		return TPromise.as(connections);
	}

	public newConnection(): void {
		this.connectionDialogService.open();
	}

	public open(connection: IConnection, sideByside: boolean): TPromise<any> {
		this._onConnectionSwitched.fire(connection);

		for (var key in this._serverEvents) {
			this._serverEvents[key].onConnectionSwitched(connection);
		}

		return this.editorService.openEditor(this.instantiationService.createInstance(QueryInput, connection), null, sideByside);
	}

	public get onConnectionSwitched(): Event<IConnection> {
		return this._onConnectionSwitched.event;
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public registerConnectionProvider(handle: number, serverEvents: RegisteredServersEvents): IDisposable {
		this._providers.push(serverEvents);

		this._serverEvents[handle] = serverEvents;

		return {
			dispose: () => {
			}
		};
	}

	public getConnectionProviders(): RegisteredServersEvents[] {
		return this._providers;
	}
}
