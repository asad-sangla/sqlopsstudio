/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { ExtHostContext, ExtHostConnectionManagementShape, MainThreadConnectionManagementShape } from 'vs/workbench/api/node/extHost.protocol';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as vscode from 'vscode';

export class MainThreadConnectionManagement extends MainThreadConnectionManagementShape {

	private _proxy: ExtHostConnectionManagementShape;

	private _toDispose: IDisposable[];

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	private _registeredServersService: IConnectionManagementService;

	constructor(
		@IThreadService threadService: IThreadService,
		@IConnectionManagementService registeredServersService: IConnectionManagementService

	) {
		super();
		this._proxy = threadService.get(ExtHostContext.ExtHostDataManagement);

		this._registeredServersService = registeredServersService;
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	$registerConnectionProvider(handle: number): TPromise<any> {
		let self = this;

		this._registrations[handle] = this._registeredServersService.addEventListener(handle, {
			onConnect(connectionUri: string, connection: vscode.ConnectionInfo): Thenable<boolean> {
				return self._proxy.$connect(handle, connectionUri, connection);
			},
			onAddConnectionProfile(connection: vscode.ConnectionInfo): Thenable<boolean> {
				let uri: string = 'connection://' + connection.serverName + ':' + connection.databaseName;
				return self._proxy.$connect(handle, uri, connection);
			}
		});

		return undefined;
	}

	$unregisterConnectionProvider(handle: number): TPromise<any> {
		let registration = this._registrations[handle];
		if (registration) {
			registration.dispose();
			delete this._registrations[handle];
		}
		return undefined;
	}
}
