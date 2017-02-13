/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { MainContext, MainThreadConnectionManagementShape, ExtHostConnectionManagementShape } from 'vs/workbench/api/node/extHost.protocol';
import * as vscode from 'vscode';
import { Disposable } from 'vs/workbench/api/node/extHostTypes';

class ConnectionAdapter {
	private _provider: vscode.ConnectionProvider;

	constructor(provider: vscode.ConnectionProvider) {
		this._provider = provider;
	}

	connect(connectionUri: string, connection: vscode.ConnectionInfo): Thenable<boolean> {
		return this._provider.connect(connectionUri, connection);
	}
}

type Adapter = ConnectionAdapter;

export class ExtHostDataManagement extends ExtHostConnectionManagementShape  {

	private _proxy: MainThreadConnectionManagementShape;

	private static _handlePool: number = 0;
	private _adapter: { [handle: number]: Adapter } = Object.create(null);

	private _createDisposable(handle: number): Disposable {
		return new Disposable(() => {
			delete this._adapter[handle];
			this._proxy.$unregisterConnectionProvider(handle);
		});
	}

	private _nextHandle(): number {
		return ExtHostDataManagement._handlePool++;
	}

	private _withAdapter<A, R>(handle: number, ctor: { new (...args: any[]): A }, callback: (adapter: A) => Thenable<R>): Thenable<R> {
		let adapter = this._adapter[handle];
		if (!(adapter instanceof ctor)) {
			return TPromise.wrapError(new Error('no adapter found'));
		}
		return callback(<any>adapter);
	}

	constructor(
		threadService: IThreadService
	) {
		super();
		this._proxy = threadService.get(MainContext.MainThreadConnectionManagement);
	}

	$registerConnectionProvider(provider: vscode.ConnectionProvider): vscode.Disposable {
		const handle = this._nextHandle();
		this._adapter[handle] = new ConnectionAdapter(provider);
		this._proxy.$registerConnectionProvider(handle);
		return this._createDisposable(handle);
	}

	$connect(handle:number, connectionUri: string, connection: vscode.ConnectionInfo): Thenable<boolean> {
		return this._withAdapter(handle, ConnectionAdapter, adapter => adapter.connect(connectionUri, connection));
	}
}
