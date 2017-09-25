/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { NewQueryAction, ScriptSelectAction, EditDataAction, ScriptCreateAction, ScriptDeleteAction } from 'sql/workbench/common/actions';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';
import { TreeSelectionHandler } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';

export class ObjectExplorerActionsContext {
	public treeNode: TreeNode;
	public connectionProfile: ConnectionProfile;
	public container: HTMLElement;
}

export class OENewQueryAction extends NewQueryAction {
	public static ID = 'objectExplorer.' + NewQueryAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string, label: string, icon: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label, icon, _queryEditorService, _connectionManagementService);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		this._treeSelectionHandler.onTreeActionStateChange(true);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);

		return super.run({ profile: connectionProfile }).then(() => {
			this._treeSelectionHandler.onTreeActionStateChange(false);
			return true;
		});
	}
}

export class OEScriptSelectAction extends ScriptSelectAction {
	public static ID = 'objectExplorer.' + ScriptSelectAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label, _queryEditorService, _connectionManagementService, _scriptingService);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		this._treeSelectionHandler.onTreeActionStateChange(true);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var ownerUri = this._connectionManagementService.getConnectionId(connectionProfile);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		return super.run({ profile: connectionProfile, object: metadata, uri: ownerUri }).then((result) => {
			this._treeSelectionHandler.onTreeActionStateChange(false);
			return result;
		});
	}
}

export class OEEditDataAction extends EditDataAction {
	public static ID = 'objectExplorer.' + EditDataAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label, _queryEditorService, _connectionManagementService);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		this._treeSelectionHandler.onTreeActionStateChange(true);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;

		return super.run({ profile: connectionProfile, object: metadata }).then((result) => {
			this._treeSelectionHandler.onTreeActionStateChange(false);
			return true;
		});
	}
}

export class OEScriptCreateAction extends ScriptCreateAction {
	public static ID = 'objectExplorer.' + ScriptCreateAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label, _queryEditorService, _connectionManagementService, _scriptingService);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		this._treeSelectionHandler.onTreeActionStateChange(true);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;
		var ownerUri = this._connectionManagementService.getConnectionId(connectionProfile);

		return super.run({ profile: connectionProfile, object: metadata, uri: ownerUri }).then((result) => {
			this._treeSelectionHandler.onTreeActionStateChange(false);
			return result;
		});
	}
}

export class OEScriptDeleteAction extends ScriptDeleteAction {
	public static ID = 'objectExplorer.' + ScriptDeleteAction.ID;
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label, _queryEditorService, _connectionManagementService, _scriptingService);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}
		this._treeSelectionHandler.onTreeActionStateChange(true);
		var connectionProfile = ObjectExplorerActionUtilities.getConnectionProfile(<TreeNode>this._objectExplorerTreeNode);
		var metadata = (<TreeNode>this._objectExplorerTreeNode).metadata;
		var ownerUri = this._connectionManagementService.getConnectionId(connectionProfile);

		return super.run({ profile: connectionProfile, object: metadata, uri: ownerUri }).then((result) => {
			this._treeSelectionHandler.onTreeActionStateChange(false);
			return result;
		});
	}
}

export class DisconnectAction extends Action {
	public static ID = 'objectExplorer.disconnect';
	public static LABEL = localize('disconnect', 'Disconnect');
	private _objectExplorerTreeNode: TreeNode;
	private _container: HTMLElement;
	private _treeSelectionHandler: TreeSelectionHandler;

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label);
	}

	public run(actionContext: any): TPromise<boolean> {
		this._treeSelectionHandler = this._instantiationService.createInstance(TreeSelectionHandler);
		if (actionContext instanceof ObjectExplorerActionsContext) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = actionContext.treeNode;
			this._container = actionContext.container;
		}

		var connectionProfile = (<TreeNode>this._objectExplorerTreeNode).getConnectionProfile();
		if (this.connectionManagementService.isProfileConnected(connectionProfile)) {
			this._treeSelectionHandler.onTreeActionStateChange(true);

			this.connectionManagementService.disconnect(connectionProfile).then(() => {
				this._treeSelectionHandler.onTreeActionStateChange(false);
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
				groupContainer.classList.add('icon');
				groupContainer.classList.add('in-progress');
			}
		}
	}

	public static hideLoadingIcon(container: HTMLElement, elementName: string): void {
		if (container) {
			let element = this.getGroupContainer(container, elementName);
			if (element && element.classList) {
				element.classList.remove('icon');
				element.classList.remove('in-progress');
			}
		}
	}

	public static getScriptMap(): Map<NodeType, any[]> {
		var scriptMap = new Map<NodeType, any[]>();
		var basicScripting = [OEScriptCreateAction, OEScriptDeleteAction];
		scriptMap.set(NodeType.Table, [OEScriptSelectAction, OEEditDataAction, OEScriptCreateAction, OEScriptDeleteAction]);
		scriptMap.set(NodeType.View, [OEScriptSelectAction, OEScriptCreateAction, OEScriptDeleteAction]);
		scriptMap.set(NodeType.Schema, basicScripting);
		scriptMap.set(NodeType.Database, basicScripting);
		scriptMap.set(NodeType.StoredProcedure, basicScripting);
		return scriptMap;
	}
}

