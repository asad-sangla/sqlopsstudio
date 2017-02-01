/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { ExtHostContext, ExtHostDataManagementShape, MainThreadDataManagementShape } from './extHost.protocol';
import { MainThreadConnectionTracker } from 'vs/workbench/api/node/mainThreadConnectionTracker';
import { IRegisteredServersService, IConnection } from 'sql/parts/connection/common/registeredServers';

export class MainThreadDataManagement extends MainThreadDataManagementShape {

	private _proxy: ExtHostDataManagementShape;

	private _toDispose: IDisposable[];

	private _tracker: MainThreadConnectionTracker;

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	private _registeredServersService: IRegisteredServersService;

	constructor(
		@IThreadService threadService: IThreadService,
		@IRegisteredServersService registeredServersService: IRegisteredServersService

	) {
		super();
		this._proxy = threadService.get(ExtHostContext.ExtHostDataManagement);

		this._toDispose = [];

		this._tracker = new MainThreadConnectionTracker(registeredServersService);
		this._toDispose.push(this._tracker.onConnection(() => this._onConnection()));

		this._registeredServersService = registeredServersService;
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	private _onConnection(): void {
		this._proxy.$connect();
	}

	$registerConnectionProvider(handle: number): TPromise<any> {
		let self = this;

		this._registrations[handle] = this._registeredServersService.registerConnectionProvider(handle, {
			onConnectionSwitched(connection: IConnection): void {
				self._proxy.$provideConnections(handle).then(conn => {
					conn.displayName = conn.displayName + conn.name;
				});

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
