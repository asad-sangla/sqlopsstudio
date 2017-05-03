/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ContributableActionProvider } from 'vs/workbench/browser/actionBarRegistry';
import { IAction } from 'vs/base/common/actions';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';
import { AddServerAction, NewQueryAction, RenameGroupAction, DeleteConnectionAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';
import { NewQueryAction as OENewQueryAction, DisconnectAction, ScriptSelectAction, EditDataAction as OEEditDataAction, ScriptCreateAction } from 'sql/parts/registeredServer/viewlet/objectExplorerActions';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

/**
 *  Provides actions for the server tree elements
 */
export class ServerTreeActionProvider extends ContributableActionProvider {

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super();
	}

	public hasActions(tree: ITree, element: any): boolean {
		return element instanceof ConnectionProfileGroup || (element instanceof ConnectionProfile) || (element instanceof TreeNode);
	}

	/**
	 * Return actions given an element in the tree
	 */
	public getActions(tree: ITree, element: any): TPromise<IAction[]> {
		if (element instanceof ConnectionProfile) {
			return TPromise.as(this.getConnectionActions(tree, element));
		}
		if (element instanceof ConnectionProfileGroup) {
			return TPromise.as(this.getConnectionProfileGroupActions(tree, element));
		}
		if (element instanceof TreeNode) {
			var treeNode = <TreeNode>element;
			return TPromise.as(this.getObjectExplorerNodeActions(treeNode));
		}

		return TPromise.as([]);
	}

	public hasSecondaryActions(tree: ITree, element: any): boolean {
		return false;
	}

	public getSecondaryActions(tree: ITree, element: any): TPromise<IAction[]> {
		return super.getSecondaryActions(tree, element);
	}

	/**
	 * Return actions for connection elements
	 */
	public getConnectionActions(tree: ITree, element: ConnectionProfile): IAction[] {
		return [
			this._instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL),
			this._instantiationService.createInstance(NewQueryAction, NewQueryAction.ID, NewQueryAction.LABEL),
			this._instantiationService.createInstance(EditDataAction, EditDataAction.ID, EditDataAction.LABEL),
			this._instantiationService.createInstance(DeleteConnectionAction, DeleteConnectionAction.ID, DeleteConnectionAction.DELETE_CONNECTION_LABEL, element)
		];
	}

	/**
	 * Return actions for connection group elements
	 */
	public getConnectionProfileGroupActions(tree: ITree, element: ConnectionProfileGroup): IAction[] {
		return [
			this._instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL),
			this._instantiationService.createInstance(RenameGroupAction, RenameGroupAction.ID, RenameGroupAction.LABEL, tree, element),
			this._instantiationService.createInstance(DeleteConnectionAction, DeleteConnectionAction.ID, DeleteConnectionAction.DELETE_CONNECTION_GROUP_LABEL, element)
		];
	}

	/**
	 * Return actions for OE elements
	 */
	public getObjectExplorerNodeActions(treeNode: TreeNode): IAction[] {
		var actions: IAction[] = [];

		if (treeNode.isTopLevel()) {
			actions.push(this._instantiationService.createInstance(DisconnectAction, DisconnectAction.ID, DisconnectAction.LABEL));
		}
		if (treeNode.nodeTypeId === NodeType.View || treeNode.nodeTypeId === NodeType.Table) {
			actions.push(this._instantiationService.createInstance(ScriptSelectAction, ScriptSelectAction.ID, ScriptSelectAction.LABEL));
			actions.push(this._instantiationService.createInstance(OEEditDataAction, OEEditDataAction.ID, OEEditDataAction.LABEL));
			actions.push(this._instantiationService.createInstance(ScriptCreateAction, ScriptCreateAction.ID, ScriptCreateAction.LABEL));
		}
		actions.push(this._instantiationService.createInstance(OENewQueryAction, OENewQueryAction.ID, OENewQueryAction.LABEL));
		return actions;
	}
}