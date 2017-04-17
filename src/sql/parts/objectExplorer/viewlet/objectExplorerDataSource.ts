/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import { ITree, IDataSource} from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { IObjectExplorerService } from 'sql/parts/objectExplorer/common/objectExplorerService';

/**
 * Implements the DataSource(that returns a parent/children of an element) for the server tree
 */
export class ObjectExplorerDataSource implements IDataSource {

	constructor(
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService,
	) {
	}

	/**
	 * Returns the unique identifier of the given element.
	 * No more than one element may use a given identifier.
	 */
	public getId(tree: ITree, element: any): string {
		if (element instanceof TreeNode) {
			return (<TreeNode>element).nodePath;
		} else {
			return undefined;
		}
	}

	/**
	 * Returns a boolean value indicating whether the element has children.
	 */
	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof TreeNode) {
			return !(<TreeNode>element).isAlwaysLeaf;
		}
		return false;
	}

	/**
	 * Returns the element's children as an array in a promise.
	 */
	public getChildren(tree: ITree, element: any): TPromise<any> {
		if (element instanceof TreeNode) {
			var node = <TreeNode>element;
			if (node.children){
				return TPromise.as(node.children);
			} else {
				return new TPromise<TreeNode[]>((resolve) => {
					this._objectExplorerService.expandTreeNode(node.getSession(), node).then(() => {
						resolve(node.children);
					});
				});
			}
		} else {
			return TPromise.as(null);
		}
	}

	/**
	 * Returns the element's parent in a promise.
	 */
	public getParent(tree: ITree, element: any): TPromise<any> {
		if (element instanceof TreeNode) {
			return TPromise.as((<TreeNode>element).parent);
		} else {
			return TPromise.as(null);
		}
	}
}