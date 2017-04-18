/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import { TaskUtilities } from 'sql/parts/common/taskUtilities';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

export class ObjectExplorerActionsContext {
	public treeNode: TreeNode;
	public container: HTMLElement;
}

export class NewQueryAction extends Action {
	public static ID = 'objectExplorer.newQuery';
	public static LABEL = localize('newQuery', 'New Query');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);

		TaskUtilities.newQuery(connectionProfile, this.connectionManagementService, this.queryEditorService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container);
		});

		return TPromise.as(true);
	}
}

export class ScriptSelectAction extends Action {
	public static ID = 'objectExplorer.scriptSelect';
	public static LABEL = localize('scriptSelect', 'Select Top 100');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IScriptingService private scriptingService: IScriptingService,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		TaskUtilities.scriptSelect(connectionProfile, metadata, ownerUri, this.connectionManagementService, this.queryEditorService, this.scriptingService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container);
		});

		return TPromise.as(true);
	}
}

export class EditDataAction extends Action {
	public static ID = 'objectExplorer.editData';
	public static LABEL = localize('editData', 'Edit Data');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		TaskUtilities.editData(connectionProfile,metadata.name, this.connectionManagementService, this.queryEditorService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container);
		});
		return TPromise.as(true);
	}
}

export class ScriptCreateAction extends Action {
	public static ID = 'objectExplorer.scriptCreate';
	public static LABEL = localize('scriptCreate', 'Script Create');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IScriptingService private scriptingService: IScriptingService,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;
		var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);

		TaskUtilities.scriptCreate(metadata, ownerUri, this.queryEditorService, this.scriptingService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container);
		});
		return TPromise.as(true);
	}
}

export class DisconnectAction extends Action {
	public static ID = 'objectExplorer.disconnect';
	public static LABEL = localize('disconnect', 'Disconnect');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}

		var connectionProfile = (<TreeNode>this._objectExplorerTreeNode).getConnectionProfile();
		if (this.connectionManagementService.isProfileConnected(connectionProfile)) {
			ObjectExplorerActionUtilities.showLoadingIcon(this._container);

			this.connectionManagementService.disconnectProfile(connectionProfile).then(() => {
				ObjectExplorerActionUtilities.hideLoadingIcon(this._container);
			});
		}

		return TPromise.as(true);
	}
}

export class ObjectExplorerActionUtilities {
	/**
	 * Get connection profile with the current database
	 */
	public static getConnectionProfile(treeNode: TreeNode): ConnectionProfile {
		var connectionProfile = treeNode.getConnectionProfile();
		var databaseName = treeNode.getDatabaseName();
		if (databaseName !== undefined && connectionProfile.databaseName !== databaseName) {
			connectionProfile = connectionProfile.clone();
			connectionProfile.databaseName = databaseName;
		}
		return connectionProfile;
	}

	public static getGroupContainer(container: HTMLElement): HTMLElement {
		var groupElementName = 'object-element-group';
		var element = container;
		while (element.className !== groupElementName) {
			element = element.parentElement;
		}
		return element.parentElement;
	}

	public static showLoadingIcon(container: HTMLElement): void {
		if (container) {
			this.getGroupContainer(container).classList.add('loading');
		}
	}

	public static hideLoadingIcon(container: HTMLElement): void {
		if (container) {
			this.getGroupContainer(container).classList.remove('loading');
		}
	}
}