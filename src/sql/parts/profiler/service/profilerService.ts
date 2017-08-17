/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ProfilerSessionID, IProfilerSession, IProfilerService } from './interfaces';

import { TPromise } from 'vs/base/common/winjs.base';
import * as data from 'data';

class TwoWayMap<T, K> {
	private forwardMap: Map<T, K>;
	private reverseMap: Map<K, T>;

	constructor() {
		this.forwardMap = new Map<T, K>();
		this.reverseMap = new Map<K, T>();
	}

	get(input: T): K {
		return this.forwardMap.get(input);
	}

	reverseGet(input: K): T {
		return this.reverseMap.get(input);
	}

	set(input: T, input2: K): TwoWayMap<T, K> {
		this.forwardMap.set(input, input2);
		this.reverseMap.set(input2, input);
		return this;
	}
}

export class ProfilerService implements IProfilerService {
	public _serviceBrand: any;
	private _providers = new Map<string, data.IProfilerProvider>();
	private _idMap = new TwoWayMap<ProfilerSessionID, string>();
	private _sessionMap = new Map<ProfilerSessionID, IProfilerSession>();

	constructor( @IConnectionManagementService private _connectionService: IConnectionManagementService) { }

	public registerProvider(providerId: string, provider: data.IProfilerProvider): void {
		this._providers.set(providerId, provider);
	}

	public registerSession(uri: string, session: IProfilerSession): ProfilerSessionID {
		this._sessionMap.set(uri, session);
		this._idMap.set(uri, uri);
		return uri;
	}

	public onMoreRows(params: data.IProfilerMoreRowsNotificationParams): void {
		this._sessionMap.get(this._idMap.reverseGet(params.uri)).onMoreRows(params.rowCount, params.data);
	}

	public getColumns(id: ProfilerSessionID): Thenable<Array<string>> {
		return this._runAction(id, provider => provider.getColumns(this._idMap.get(id)));
	}

	public connectSession(id: ProfilerSessionID): Thenable<boolean> {
		return this._runAction(id, provider => provider.connectSession(this._idMap.get(id)));
	}

	public disconnectSession(id: ProfilerSessionID): Thenable<boolean> {
		return this._runAction(id, provider => provider.disconnectSession(this._idMap.get(id)));
	}

	public startSession(id: ProfilerSessionID): Thenable<boolean> {
		return this._runAction(id, provider => provider.startSession(this._idMap.get(id)));
	}

	public pauseSession(id: ProfilerSessionID): Thenable<boolean> {
		return this._runAction(id, provider => provider.pauseSession(this._idMap.get(id)));
	}

	public stopSession(id: ProfilerSessionID): Thenable<boolean> {
		return this._runAction(id, provider => provider.stopSession(this._idMap.get(id)));
	}

	private _runAction<T>(id: ProfilerSessionID, action: (handler: data.IProfilerProvider) => Thenable<T>): Thenable<T> {
		// let providerId = this._connectionService.getProviderIdFromUri(this._idMap.get(id));
		let providerId = 'default';

		if (!providerId) {
			return TPromise.wrapError(new Error('Connection is required in order to interact with queries'));
		}
		let handler = this._providers.get(providerId);
		if (handler) {
			return action(handler);
		} else {
			return TPromise.wrapError(new Error('No Handler Registered'));
		}
	}
}
