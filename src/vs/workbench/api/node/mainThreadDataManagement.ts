/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { IModeService } from 'vs/editor/common/services/modeService';
import { ExtHostContext, ExtHostDataManagementShape, MainThreadDataManagementShape } from './extHost.protocol';
import { MainThreadConnectionTracker } from 'vs/workbench/api/node/mainThreadConnectionTracker';
import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers'

export class MainThreadDataManagement extends MainThreadDataManagementShape {

	private _proxy: ExtHostDataManagementShape;

	private _modeService: IModeService;

	private _toDispose: IDisposable[];

	private _tracker: MainThreadConnectionTracker;

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

	private _onConnection(): void {
		this._proxy.$connect();
	}

	$getLanguages(): TPromise<string[]> {
		return TPromise.as([ 'lang']);
	}
}
