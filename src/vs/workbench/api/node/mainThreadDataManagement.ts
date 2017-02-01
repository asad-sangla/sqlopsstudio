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
import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';

export class MainThreadDataManagement extends MainThreadDataManagementShape {

	private _proxy: ExtHostDataManagementShape;

	private _toDispose: IDisposable[];

	private _tracker: MainThreadConnectionTracker;

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		@IThreadService threadService: IThreadService,
		@IRegisteredServersService registeredServersService: IRegisteredServersService,
	) {
		super();
		this._proxy = threadService.get(ExtHostContext.ExtHostDataManagement);

		this._toDispose = [];

		this._tracker = new MainThreadConnectionTracker(registeredServersService);
		this._toDispose.push(this._tracker.onConnection(() => this._onConnection()));
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	private _onConnection(): void {
		this._proxy.$connect();
	}

	$registerConnectionProvider(handle: number): TPromise<any> {
		//this._registrations[handle] =

		// modes.LinkProviderRegistry.register(selector, <modes.LinkProvider>{
		// 	provideLinks: (model, token) => {
		// 		return wireCancellationToken(token, this._proxy.$provideDocumentLinks(handle, model.uri));
		// 	},
		// 	resolveLink: (link, token) => {
		// 		return wireCancellationToken(token, this._proxy.$resolveDocumentLink(handle, link));
		// 	}
		// });
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
