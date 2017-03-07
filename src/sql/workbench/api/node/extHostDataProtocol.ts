/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { MainContext, MainThreadDataProtocolShape, ExtHostDataProtocolShape } from 'vs/workbench/api/node/extHost.protocol';
import * as vscode from 'vscode';
import { Disposable } from 'vs/workbench/api/node/extHostTypes';

export class ExtHostDataProtocol extends ExtHostDataProtocolShape  {

	private _proxy: MainThreadDataProtocolShape;

	private static _handlePool: number = 0;
	private _adapter: { [handle: number]: vscode.DataProtocolProvider } = Object.create(null);


	constructor(
		threadService: IThreadService
	) {
		super();
		this._proxy = threadService.get(MainContext.MainThreadDataProtocol);
	}

	private _createDisposable(handle: number): Disposable {
		return new Disposable(() => {
			delete this._adapter[handle];
			this._proxy.$unregisterProvider(handle);
		});
	}

	private _nextHandle(): number {
		return ExtHostDataProtocol._handlePool++;
	}

	$registerProvider(provider: vscode.DataProtocolProvider): vscode.Disposable {
		provider.handle = this._nextHandle();

		this._adapter[provider.handle] = provider;
		this._proxy.$registerProvider(provider.handle);
		return this._createDisposable(provider.handle);
	}

	// Capabilities Discovery handlers
	$getServerCapabilities(handle:number, client: vscode.DataProtocolClientCapabilities): Thenable<vscode.DataProtocolServerCapabilities> {
		let provider = this._adapter[handle];
		return provider !== undefined
			? provider.capabilitiesProvider.getServerCapabilities(client)
			: undefined;
	}

	// Connection Management handlers
	$connect(handle:number, connectionUri: string, connection: vscode.ConnectionInfo): Thenable<boolean> {
		let provider = this._adapter[handle];
		return provider !== undefined
			? provider.connectionProvider.connect(connectionUri, connection)
			: undefined;
	}

	$onConnectComplete(handle: number, connectionInfoSummary: vscode.ConnectionInfoSummary): void{
		this._proxy.$onConnectionComplete(handle, connectionInfoSummary);
	}

	$onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._proxy.$onIntelliSenseCacheComplete(handle, connectionUri);
	}
}
