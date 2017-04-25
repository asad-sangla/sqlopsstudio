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
import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import { NodeType } from 'sql/parts/objectExplorer/common/nodeType';
import { NewQueryAction, DisconnectAction, ScriptSelectAction, EditDataAction, ScriptCreateAction } from 'sql/parts/objectExplorer/viewlet/objectExplorerActions';

/**
 *  Provides actions for the object explorer tree elements
 */
export class ObjectExplorerActionProvider extends ContributableActionProvider {

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		super();
	}

	public hasActions(tree: ITree, element: any): boolean {
		return element instanceof TreeNode;
	}

	/**
	 * Return actions given an element in the tree
	 */
	public getActions(tree: ITree, element: any): TPromise<IAction[]> {
		var actions: IAction[] = [];
		if (element instanceof TreeNode) {
			var treeNode = <TreeNode>element;
			if (treeNode.isTopLevel()) {
				actions.push(this.instantiationService.createInstance(DisconnectAction, DisconnectAction.ID, DisconnectAction.LABEL));
			}
			if (treeNode.nodeTypeId === NodeType.View || treeNode.nodeTypeId === NodeType.Table) {
				actions.push(this.instantiationService.createInstance(ScriptSelectAction, ScriptSelectAction.ID, ScriptSelectAction.LABEL));
				actions.push(this.instantiationService.createInstance(EditDataAction, EditDataAction.ID, EditDataAction.LABEL));
				actions.push(this.instantiationService.createInstance(ScriptCreateAction, ScriptCreateAction.ID, ScriptCreateAction.LABEL));
			}
			actions.push(this.instantiationService.createInstance(NewQueryAction, NewQueryAction.ID, NewQueryAction.LABEL));
		}

		return TPromise.as(actions);
	}

	public hasSecondaryActions(tree: ITree, element: any): boolean {
		return false;
	}

	public getSecondaryActions(tree: ITree, element: any): TPromise<IAction[]> {
		return super.getSecondaryActions(tree, element);
	}
}