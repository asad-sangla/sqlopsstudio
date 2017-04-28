/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';

export interface IObjectExplorerTemplateData {
	root: HTMLElement;
	label: HTMLSpanElement;
	icon: HTMLElement;
	treeNode: TreeNode;
}