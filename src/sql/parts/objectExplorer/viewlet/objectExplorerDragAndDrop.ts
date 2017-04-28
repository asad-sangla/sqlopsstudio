/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ITree, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';

/**
 * Implements drag and drop for the object explorer tree
 */
export class ObjectExplorerDragAndDrop implements IDragAndDrop {

	constructor( @IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService
	) {
	}

	/**
	 * Returns a uri if the given element should be allowed to drag.
	 * Returns null, otherwise.
	 */
	public getDragURI(tree: ITree, element: any): string {
		if (element instanceof TreeNode) {
			return (<TreeNode>element).nodePath;
		}
		return null;
	}

	/**
	 * Returns a label(name) to display when dragging the element.
	 */
	public getDragLabel(tree: ITree, elements: any[]): string {
		if (elements[0] instanceof TreeNode) {
			return (<TreeNode>elements[0]).label;
		}
		return undefined;
	}

	/**
	 * Sent when the drag operation is starting.
	 */
	public onDragStart(tree: ITree, data: IDragAndDropData, originalEvent: DragMouseEvent): void {
		return;
	}

	/**
	 * Returns a DragOverReaction indicating whether sources can be
	 * dropped into target or some parent of the target.
	 */
	public onDragOver(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): IDragOverReaction {
		return DRAG_OVER_REJECT;
	}

	/**
	 * Handle drop in the object explorer tree.
	 */
	public drop(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): void {
		// No op
	}
}