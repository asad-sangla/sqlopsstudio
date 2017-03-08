/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { ExtHostContext, ExtHostDataProtocolShape, MainThreadDataProtocolShape } from 'vs/workbench/api/node/extHost.protocol';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import * as vscode from 'vscode';

/**
 * Main thread class for handling data protocol management registration.
 */
export class MainThreadDataProtocol extends MainThreadDataProtocolShape {

	private _proxy: ExtHostDataProtocolShape;

	private _toDispose: IDisposable[];

	private _connectionRegistrations: { [handle: number]: IDisposable; } = Object.create(null);

	private _capabilitiesRegistrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		@IThreadService threadService: IThreadService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService

	) {
		super();
		this._proxy = threadService.get(ExtHostContext.ExtHostDataProtocol);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $registerProvider(handle: number): TPromise<any> {
		let self = this;

		// register connection management provider
		this._connectionRegistrations[handle] = this._connectionManagementService.addEventListener(handle, {
			onConnect(connectionUri: string, connection: vscode.ConnectionInfo): Thenable<boolean> {
				return self._proxy.$connect(handle, connectionUri, connection);
			},
			onAddConnectionProfile(uri, connection: vscode.ConnectionInfo): Thenable<boolean> {
				return self._proxy.$connect(handle, uri, connection);
			},
			onDeleteConnectionProfile(uri, connection: vscode.ConnectionInfo): void {
				//no op
			}
		});

		this._capabilitiesService.registerProvider(<vscode.CapabilitiesProvider>{
			getServerCapabilities(client: vscode.DataProtocolClientCapabilities): Thenable<vscode.DataProtocolServerCapabilities> {
				return self._proxy.$getServerCapabilities(handle, client);
			}
		});

		return undefined;
	}

	// Connection Management handlers
	public $onConnectionComplete(handle: number, connectionInfoSummary: vscode.ConnectionInfoSummary): void {
		this._connectionManagementService.onConnectionComplete(handle, connectionInfoSummary);
	}

	public $onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._connectionManagementService.onIntelliSenseCacheComplete(handle, connectionUri);
	}

	public $unregisterProvider(handle: number): TPromise<any> {
		let connectionRegistration = this._connectionRegistrations[handle];
		if (connectionRegistration) {
			connectionRegistration.dispose();
			delete this._connectionRegistrations[handle];
		}

		let capabilitiesRegistration = this._capabilitiesRegistrations[handle];
		if (capabilitiesRegistration) {
			capabilitiesRegistration.dispose();
			delete this._capabilitiesRegistrations[handle];
		}

		return undefined;
	}
}
