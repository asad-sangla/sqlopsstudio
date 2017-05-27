/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

export class ObjectExplorerActionsContext {
	public treeNode: TreeNode;
	public connectionProfile: ConnectionProfile;
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
		ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);

		TaskUtilities.newQuery(connectionProfile, this.connectionManagementService, this.queryEditorService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
		});

		return TPromise.as(true);
	}
}

export class ScriptSelectAction extends Action {
	public static ID = 'objectExplorer.scriptSelect';
	public static LABEL = localize('scriptSelect', 'Select Top 1000');
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
		return new TPromise<boolean>((resolve, reject) => {
			if (actionContext instanceof ObjectExplorerActionsContext) {
				//set objectExplorerTreeNode for context menu clicks
				this._objectExplorerTreeNode = actionContext.treeNode;
				this._container = actionContext.container;
			}
			ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
			var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);
			var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

			TaskUtilities.scriptSelect(connectionProfile, metadata, ownerUri, this.connectionManagementService,
				this.queryEditorService, this.scriptingService).then(() => {
					ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
					resolve(true);
				}).catch(error => {
					ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
					reject(error);
				});
		});
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
		ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		TaskUtilities.editData(connectionProfile, metadata.name, metadata.schema, this.connectionManagementService, this.queryEditorService).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
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
		return new TPromise<boolean>((resolve, reject) => {
			if (actionContext instanceof ObjectExplorerActionsContext) {
				//set objectExplorerTreeNode for context menu clicks
				this._objectExplorerTreeNode = actionContext.treeNode;
				this._container = actionContext.container;
			}
			ObjectExplorerActionUtilities.showLoadingIcon(this._container,  ObjectExplorerActionUtilities.objectExplorerElementClass);
			var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
			var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;
			var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);

			TaskUtilities.scriptCreate(connectionProfile, metadata, ownerUri, this.connectionManagementService, this.queryEditorService, this.scriptingService).then(() => {
				ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
				resolve(true);
			}).catch(error => {
				ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
				reject(error);
			});
		});
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
			ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);

			this.connectionManagementService.disconnectProfile(connectionProfile).then(() => {
				ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			});
		}

		return TPromise.as(true);
	}
}

export class ObjectExplorerActionUtilities {

	public static readonly objectExplorerElementClass = 'object-element-group';
	public static readonly connectionElementClass = 'connection-tile';
	/**
	 * Get connection profile with the current database
	 */
	public static getConnectionProfile(treeNode: TreeNode): ConnectionProfile {
		var connectionProfile = treeNode.getConnectionProfile();
		var databaseName = treeNode.getDatabaseName();
		if (databaseName !== undefined && connectionProfile.databaseName !== databaseName) {
			connectionProfile = connectionProfile.cloneWithDatabase(databaseName);
		}
		return connectionProfile;
	}

	private static getGroupContainer(container: HTMLElement, elementName: string): HTMLElement {
		var element = container;
		while (element && element.className !== elementName) {
			element = element.parentElement;
		}
		return element ? element.parentElement : undefined;
	}

	public static showLoadingIcon(container: HTMLElement, elementName: string): void {
		if (container) {
			let groupContainer = this.getGroupContainer(container, elementName);
			if (groupContainer) {
				groupContainer.classList.add('loading');
			}
		}
	}

	public static hideLoadingIcon(container: HTMLElement, elementName: string): void {
		if (container) {
			let element = this.getGroupContainer(container, elementName);
			if (element && element.classList) {
				element.classList.remove('loading');
			}
		}
	}
}