/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

export class ChangeConnectionAction extends Action {

	readonly ConnectionUri = 'connection://';
	private static EnabledClass = 'extension-action update';
	private static DisabledClass = `${ChangeConnectionAction.EnabledClass} disabled`;
	private static Label = localize('ConnectAction', "Connect");
	private _disposables: IDisposable[] = [];
	private _connectionProfile: ConnectionProfile;
	get connectionProfile(): ConnectionProfile {
		return this._connectionProfile;
	}
	set connectionProfile(profile: ConnectionProfile) {
		this._connectionProfile = profile;
		this.update();
	}

	constructor(
		@IInstantiationService private _instanstiationService: IInstantiationService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super('registeredConnections.connect', ChangeConnectionAction.Label, ChangeConnectionAction.DisabledClass, false);
		const self = this;
		this._connectionManagementService.onConnect(() => {
			self.onConnect();
		});
	}

	private update(): void {
		this.enabled = true;
		this.class = ChangeConnectionAction.EnabledClass;
		this.setLabel();
	}

	private onConnect(): void {
		this.setLabel();
	}

	private setLabel(): void {
		let uri = this.ConnectionUri + this._connectionProfile.getUniqueId();
		this.label = this._connectionManagementService.isConnected(uri) ? 'Disconnect' : 'Connect';
	}

	run(): TPromise<any> {
		let uri = this.ConnectionUri + this._connectionProfile.getUniqueId();
		if (this._connectionManagementService.isConnected(uri)) {
			this.label = 'Connect';
			return TPromise.as(true);
		}
		this._connectionManagementService.connectProfile(this._connectionProfile).then((value) => {
			if (value) {
				this.update();
			}
		});
		return TPromise.as(true);
	}

	dispose(): void {
		super.dispose();
		this._disposables = dispose(this._disposables);
	}
}