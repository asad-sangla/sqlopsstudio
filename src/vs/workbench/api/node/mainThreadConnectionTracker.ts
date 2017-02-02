/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Event, { Emitter } from 'vs/base/common/event';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import vscode = require('vscode');

import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';

export class MainThreadConnectionTracker {

	private _registerServersService: IRegisteredServersService;

	private _onConnection: Emitter<void>;

	private _toDispose: IDisposable[];

	constructor(registerServersService: IRegisteredServersService) {

		this._registerServersService = registerServersService;

		this._toDispose = [];

		this._onConnection = new Emitter<void>();
		this._registerServersService.onConnectionSwitched(this._onConnectionSwitched, this, this._toDispose);
	}

	public get onConnection(): Event<void> {
		return this._onConnection.event;
	}

	private _onConnectionSwitched(): void {
		this._onConnection.fire(undefined);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}
}
