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
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { ServerTreeView } from 'sql/parts/registeredServer/viewlet/serverTreeView';
import { ConnectionViewlet } from 'sql/parts/registeredServer/viewlet/connectionViewlet';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { EditorPart } from 'vs/workbench/browser/parts/editor/editorPart';
import { TaskUtilities } from 'sql/parts/common/taskUtilities';
import { TreeUpdateUtils } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import * as Constants from 'sql/parts/connection/common/constants';

export class ChangeConnectionAction extends Action {

	private static EnabledClass: string = 'extension-action update';
	private static DisabledClass: string = `${ChangeConnectionAction.EnabledClass} disabled`;
	private static Label: string = localize('ConnectAction', 'Connect');
	private _disposables: IDisposable[] = [];
	private _connectionProfile: ConnectionProfile;

	public parentContainer: HTMLElement;

	get connectionProfile(): ConnectionProfile {
		return this._connectionProfile;
	}
	set connectionProfile(profile: ConnectionProfile) {
		this._connectionProfile = profile;
		this.update();
	}

	constructor(
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super('registeredConnections.connect', ChangeConnectionAction.Label, ChangeConnectionAction.DisabledClass, false);
		const self = this;
		this._disposables.push(this._connectionManagementService.onConnect(() => {
			self.onConnect();
		})
		);
		this._disposables.push(this._connectionManagementService.onDisconnect((disconnectParams) => {
			self.setLabel();
			self._connectionManagementService.closeDashboard(disconnectParams.connectionUri);
		})
		);
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
			return;
		}
		this.label = this._connectionManagementService.isProfileConnected(this._connectionProfile) ? 'Disconnect' : 'Connect';
	}

	run(): TPromise<any> {
		if (!this._connectionProfile) {
			return TPromise.as(true);
		}
		if (this._connectionManagementService.isProfileConnected(this._connectionProfile)) {
			return new TPromise<boolean>((resolve, reject) => {
				this._connectionManagementService.disconnectProfile(this._connectionProfile).then((value) => resolve(true));
			});
		} else {
			let options: IConnectionCompletionOptions = {
				params: undefined,
				saveToSettings: false,
				showDashboard: true,
				showConnectionDialogOnError: true
			};

			this.enabled = false;
			if (this.parentContainer) {
				this.parentContainer.classList.add('connecting');
			}

			return new TPromise<boolean>((resolve, reject) => {
				this._connectionManagementService.connect(this._connectionProfile, undefined, options).then((connectionResult) => {
					if (this.parentContainer) {
						this.parentContainer.classList.remove('connecting');
					}

					if (connectionResult && connectionResult.connected) {
						this.update();
					}
					resolve(true);
				});
			});
		}

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
	public static LABEL = localize('addConnection', 'Add Connection');

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
			getOptionsKey: undefined,
			providerName: '',
			options: {},
			saveProfile: true,
			id: element.id
		};
		this._connectionManagementService.showConnectionDialog(undefined, connection);
		return TPromise.as(true);
	}
}

/**
 * Display active connections in the tree
 */
export class ActiveConnectionsFilterAction extends Action {
	public static ID = 'registeredServers.recentConnections';
	public static LABEL = localize('activeConnections', 'Active Connections');
	private static enabledClass = 'active-connections-action';
	private static disabledClass = 'active-connections-action-set';
	private _isSet: boolean;
	public get isSet(): boolean {
		return this._isSet;
	}
	public set isSet(value: boolean) {
		this._isSet = value;
		this.class = (!this._isSet) ?
			ActiveConnectionsFilterAction.enabledClass : ActiveConnectionsFilterAction.disabledClass;
	}

	constructor(
		id: string,
		label: string,
		private view: ServerTreeView,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = ActiveConnectionsFilterAction.enabledClass;
	}

	public run(): TPromise<boolean> {
		if (!this.view) {
			// return without doing anything
			return TPromise.as(true);
		}
		if (this.class === ActiveConnectionsFilterAction.enabledClass) {
			// show active connections in the tree
			this.view.showFilteredTree('active');
			this.isSet = true;
		} else {
			// show full tree
			this.view.refreshTree();
			this.isSet = false;
		}
		return TPromise.as(true);
	}
}

/**
 * Display recent connections in the tree
 */
export class RecentConnectionsFilterAction extends Action {
	public static ID = 'registeredServers.recentConnections';
	public static LABEL = localize('recentConnections', 'Recent Connections');
	private static enabledClass = 'recent-connections-action';
	private static disabledClass = 'recent-connections-action-set';
	private _isSet: boolean;
	public get isSet(): boolean {
		return this._isSet;
	}
	public set isSet(value: boolean) {
		this._isSet = value;
		this.class = (!this._isSet) ?
			RecentConnectionsFilterAction.enabledClass : RecentConnectionsFilterAction.disabledClass;
	}
	constructor(
		id: string,
		label: string,
		private view: ServerTreeView,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = RecentConnectionsFilterAction.enabledClass;
		this._isSet = false;
	}

	public run(): TPromise<boolean> {
		if (!this.view) {
			// return without doing anything
			return TPromise.as(true);
		}
		if (this.class === RecentConnectionsFilterAction.enabledClass) {
			// show recent connections in the tree
			this.view.showFilteredTree('recent');
			this.isSet = true;
		} else {
			// show full tree
			this.view.refreshTree();
			this.isSet = false;
		}
		return TPromise.as(true);
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

		TaskUtilities.newQuery(this._connectionProfile, this.connectionManagementService, this.queryEditorService);
		return TPromise.as(true);
	}
}

/**
 * Actions to delete a server/group
 */
export class DeleteConnectionAction extends Action {
	public static ID = 'registeredServers.deleteConnection';
	public static DELETE_CONNECTION_LABEL = localize('deleteConnection', 'Delete Connection');
	public static DELETE_CONNECTION_GROUP_LABEL = localize('deleteConnectionGroup', 'Delete Group');

	constructor(
		id: string,
		label: string,
		private element: ConnectionProfile | ConnectionProfileGroup,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'delete-connection-action';
		if (element instanceof ConnectionProfileGroup && element.id === Constants.unsavedGroupId) {
			this.enabled = false;
		}

		if (element instanceof ConnectionProfile) {
			element = <ConnectionProfile>element;
			let parent: ConnectionProfileGroup = element.parent;
			if (parent && parent.id === Constants.unsavedGroupId) {
				this.enabled = false;
			}
		}
	}

	public run(): TPromise<boolean> {
		if (this.element instanceof ConnectionProfile) {
			this._connectionManagementService.deleteConnection(this.element);
		} else if (this.element instanceof ConnectionProfileGroup) {
			this._connectionManagementService.deleteConnectionGroup(this.element);
		}
		return TPromise.as(true);
	}
}

/**
 * Action to rename a server group
 */
export class RenameGroupAction extends Action {
	public static ID = 'registeredServers.renameGroup';
	public static LABEL = localize('renameGroup', 'Rename Group');
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
		private _tree: ITree,
		private _element: ConnectionProfileGroup,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'rename';
		this.label = 'Rename Group';
		if (this._element.id === Constants.unsavedGroupId) {
			this.enabled = false;
		}
	}

	public run(): TPromise<boolean> {
		this._element.isRenamed = true;
		this._tree.refresh(this._element, false);
		return TPromise.as(true);
	}
}

/**
 * Action to clear search results
 */
export class ClearSearchAction extends Action {
	public static ID = 'registeredServers.clearSearch';
	public static LABEL = localize('clearSearch', 'Clear Search');

	constructor(
		id: string,
		label: string,
		private _viewlet: ConnectionViewlet,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'clear-search';
		this.enabled = false;
	}

	public run(): TPromise<boolean> {
		this._viewlet.clearSearch();
		return TPromise.as(true);
	}
}