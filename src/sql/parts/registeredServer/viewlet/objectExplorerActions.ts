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
import { NewQueryAction, ScriptSelectAction, EditDataAction, ScriptCreateAction } from 'sql/common/baseActions';

export class ObjectExplorerActionsContext {
	public treeNode: TreeNode;
	public connectionProfile: ConnectionProfile;
	public container: HTMLElement;
}

export class OENewQueryAction extends NewQueryAction {
	protected static ID = 'objectExplorer.' + NewQueryAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, OENewQueryAction.ID);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);

		return super.run({profile: connectionProfile}).then(() => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			return true;
		});
	}
}

export class OEScriptSelectAction extends ScriptSelectAction {
	protected static ID = 'objectExplorer.' + ScriptSelectAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		@IScriptingService protected scriptingService: IScriptingService,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, scriptingService, OEScriptSelectAction.ID);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		return super.run({ profile: connectionProfile, object: metadata, uri: ownerUri }).then((result) => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			return result;
		});
	}
}

export class OEEditDataAction extends EditDataAction {
	protected static ID = 'objectExplorer.' + EditDataAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, OEEditDataAction.ID);
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

		return super.run({ profile: connectionProfile, object: metadata }).then((result) => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			return true;
		});
	}
}

export class OEScriptCreateAction extends ScriptCreateAction {
	protected static ID = 'objectExplorer.' + ScriptCreateAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;

	constructor(
		@IScriptingService protected scriptingService: IScriptingService,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, scriptingService, OEScriptCreateAction.ID);
	}

	public run(actionContext: any): TPromise<boolean> {
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		ObjectExplorerActionUtilities.showLoadingIcon(this._container,  ObjectExplorerActionUtilities.objectExplorerElementClass);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;
		var ownerUri = this.connectionManagementService.getConnectionId(connectionProfile);

		return super.run({ profile: connectionProfile, object: metadata, uri: ownerUri }).then((result) => {
			ObjectExplorerActionUtilities.hideLoadingIcon(this._container, ObjectExplorerActionUtilities.objectExplorerElementClass);
			return result;
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