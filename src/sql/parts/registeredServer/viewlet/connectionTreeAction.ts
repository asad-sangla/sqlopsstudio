/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IConnectionManagementService, IConnectionCompletionOptions, IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { ServerTreeView } from 'sql/parts/registeredServer/viewlet/serverTreeView';
import { ConnectionViewlet } from 'sql/parts/registeredServer/viewlet/connectionViewlet';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import * as Constants from 'sql/parts/connection/common/constants';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import Severity from 'vs/base/common/severity';

export class RefreshAction extends Action {

	public static ID = 'objectExplorer.refresh';
	public static LABEL = localize('refresh', 'Refresh');
	private _tree: ITree;

	constructor(
		id: string,
		label: string,
		tree: ITree,
		private element: ConnectionProfile | TreeNode,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService
	) {
		super(id, label);
		this._tree = tree;
	}
	public run(): TPromise<boolean> {
		var treeNode: TreeNode;
		if (this.element instanceof ConnectionProfile) {
			if (this._connectionManagementService.isConnected(undefined, this.element)) {
				treeNode = this._objectExplorerService.getObjectExplorerNode(this.element);
			}
		} else if (this.element instanceof TreeNode) {
			treeNode = this.element;
		}

		if (treeNode) {
			this._objectExplorerService.refreshTreeNode(treeNode.getSession(), treeNode).then(() => {
				this._tree.refresh(this.element).then(() => {
					this._tree.expand(this.element);
				});
			});
		}
		return TPromise.as(true);
	}
}

export class ChangeConnectionAction extends Action {
	public static ID = 'objectExplorer.connect';
	public static LABEL = localize('ConnectAction', 'Connect/Disconnect');

	private _disposables: IDisposable[] = [];
	private _connectionProfile: ConnectionProfile;

	public parentContainer: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
		super(id, label);
		const self = this;
		this._disposables.push(this._connectionManagementService.onConnect(() => {
			self.setLabel();
		})
		);
		this._disposables.push(this._connectionManagementService.onDisconnect((disconnectParams) => {
			self.setLabel();
			self._connectionManagementService.closeDashboard(disconnectParams.connectionUri);
		})
		);
		if (this._objectExplorerService && this._objectExplorerService.onUpdateObjectExplorerNodes) {
			this._disposables.push(this._objectExplorerService.onUpdateObjectExplorerNodes((args) => {
				self.removeSpinning(args.connection);
				if (args.errorMessage !== undefined) {
					self.showError(args.errorMessage);
				}
			})
			);
		}
	}

	private showError(errorMessage: string) {
		this._errorMessageService.showDialog(undefined, Severity.Error, '', errorMessage);
	}

	private setLabel(): void {
		if (!this._connectionProfile) {
			this.label = 'Connect';
			return;
		}
		this.label = this._connectionManagementService.isProfileConnected(this._connectionProfile) ? 'Disconnect' : 'Connect';
	}

	private removeSpinning(connection: IConnectionProfile): void {
		if (this._connectionProfile) {
			if (connection.id === this._connectionProfile.id && this.parentContainer) {
				this.parentContainer.classList.remove('connecting');
			}
		}
	}

	run(connectionProfile: ConnectionProfile): TPromise<any> {
		if (connectionProfile instanceof ConnectionProfile) {
			//set connectionProfile for context menu clicks
			this._connectionProfile = connectionProfile;
		}
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
				saveTheConnection: false,
				showDashboard: true,
				showConnectionDialogOnError: true
			};

			this.enabled = false;
			if (this.parentContainer) {
				this.parentContainer.classList.add('connecting');
			}

			return new TPromise<boolean>((resolve, reject) => {
				this._connectionManagementService.connect(this._connectionProfile, undefined, options).then((connectionResult) => {
					if (connectionResult && connectionResult.connected) {
						this.setLabel();
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
	public static LABEL = localize('addConnection', 'New Connection');

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
 * Actions to add a server to the group
 */
export class AddServerGroupAction extends Action {
	public static ID = 'registeredServers.addServerGroup';
	public static LABEL = localize('addServerGroup', 'Add Server Group');

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'add-server-group-action';
	}

	public run(): TPromise<boolean> {
		this._connectionManagementService.showServerGroupDialog();
		return TPromise.as(true);
	}
}

/**
 * Display active connections in the tree
 */
export class ActiveConnectionsFilterAction extends Action {
	public static ID = 'registeredServers.recentConnections';
	public static LABEL = localize('activeConnections', 'Show Active Connections');
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