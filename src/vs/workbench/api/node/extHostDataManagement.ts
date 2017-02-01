/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { MainContext, MainThreadDataManagementShape, ExtHostDataManagementShape } from './extHost.protocol';
import * as vscode from 'vscode';
import * as connection from 'sql/parts/connection/common/registeredServers';
import { Disposable } from 'vs/workbench/api/node/extHostTypes';


class ConnectionAdapter {
	private _provider: vscode.IConnectionProvider;

	constructor(provider: vscode.IConnectionProvider) {
		this._provider = provider;
	}

	provideConnections(): Thenable<vscode.IDataConnection> {
		return this._provider.$provideConnections();
	}
}

type Adapter = ConnectionAdapter;

export class ExtHostDataManagement extends ExtHostDataManagementShape  {

	private _proxy: MainThreadDataManagementShape;

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
		this._proxy = threadService.get(MainContext.MainThreadDataManagement);
	}

	$registerConnectionProvider(provider: vscode.IConnectionProvider): vscode.Disposable {
		const handle = this._nextHandle();
		this._adapter[handle] = new ConnectionAdapter(provider);
		this._proxy.$registerConnectionProvider(handle);
		return this._createDisposable(handle);
	}

	$provideConnections(handle: number): Thenable<vscode.IDataConnection> {
		return this._withAdapter(handle, ConnectionAdapter, adapter => adapter.provideConnections());
	}

	$connect(): void {
		// this.$provideConnections(0);
	}

}
