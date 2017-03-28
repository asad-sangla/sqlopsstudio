/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService, IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';

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
		if (!this._connectionProfile) {
			this.label = 'Connect';
			return ;
		}
		let uri = this.ConnectionUri + this._connectionProfile.getUniqueId();
		this.label = this._connectionManagementService.isConnected(uri) ? 'Disconnect' : 'Connect';
	}

	run(): TPromise<any> {
		if (!this._connectionProfile) {
			return TPromise.as(true);
		}
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

/**
 * Actions to add a server to the group
 */
export class AddServerAction extends Action {
	public static ID = 'registeredServers.addConnection';
	public static LABEL = localize('addConnection', "Add Connection");

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'add-server-action';
	}

	public run(element: ConnectionProfileGroup): TPromise<boolean> {
		let connection: IConnectionProfile = {
			serverName: undefined,
			databaseName: undefined,
			userName: undefined,
			password: undefined,
			authenticationType: undefined,
			groupId: undefined,
			groupFullName: element.fullName,
			savePassword: undefined,
			getUniqueId: undefined,
			providerName: '',
			options: {},
			saveProfile: true
		};
		this._connectionManagementService.newConnection(undefined, connection);
		return TPromise.as(true);
	}
}

/**
 * Display active connections in the tree
 */
export class ActiveConnectionsFilterAction extends Action {
	public static ID = 'registeredServers.recentConnections';
	public static LABEL = localize('activeConnections', "Active Connections");
	private static enabledClass = 'active-connections-action';
	private static disabledClass = 'active-connections-action-set';

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = ActiveConnectionsFilterAction.enabledClass;
	}

	public run(element: ConnectionProfileGroup): TPromise<boolean> {
		//TODO
		this.toggleClass();
		console.log('Show active connections ');
		return TPromise.as(true);
	}

	private toggleClass() {
		this.class = (this.class === ActiveConnectionsFilterAction.disabledClass) ?
			ActiveConnectionsFilterAction.enabledClass : ActiveConnectionsFilterAction.disabledClass;
	}
}

/**
 * Display recent connections in the tree
 */
export class RecentConnectionsFilterAction extends Action {
	public static ID = 'registeredServers.recentConnections';
	public static LABEL = localize('recentConnections', "Recent Connections");
	private static enabledClass = 'active-connections-action';
	private static disabledClass = 'active-connections-action-set';

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'recent-connections-action';
	}

	public run(element: ConnectionProfileGroup): TPromise<boolean> {
		//TODO
		this.toggleClass();
		console.log('Show recent connections');
		return TPromise.as(true);
	}

	private toggleClass() {
		this.class = (this.class === RecentConnectionsFilterAction.disabledClass) ?
			RecentConnectionsFilterAction.enabledClass : RecentConnectionsFilterAction.disabledClass;
	}
}



export class NewQueryAction extends Action {
	public static ID = 'registeredServers.newQuery';
	public static LABEL = localize('newQuery', 'New Query');
	private _connectionProfile: ConnectionProfile;
	get connectionProfile(): ConnectionProfile {
		return this._connectionProfile;
	}
	set connectionProfile(profile: ConnectionProfile) {
		this._connectionProfile = profile;
	}

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'extension-action update';
		this.label = 'Query';
	}

	public run(connectionProfile: any): TPromise<boolean> {
		if (connectionProfile instanceof ConnectionProfile) {
			//set connectionProfile for context menu clicks
			this._connectionProfile = connectionProfile;
		}
		this.queryEditorService.newSqlEditor().then((owner: IConnectableInput) => {
			// Connect our editor to the input connection
			this.connectionManagementService.connectEditor(owner, false, this._connectionProfile);
		});
		return TPromise.as(true);
	}
}