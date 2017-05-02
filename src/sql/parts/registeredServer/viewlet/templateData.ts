/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';

export interface IConnectionTemplateData {
	root: HTMLElement;
	iconGroup: HTMLElement;
	icon: HTMLElement;
	labelGroup: HTMLElement;
	serverName: HTMLSpanElement;
	databaseName: HTMLElement;
	connectionProfile: ConnectionProfile;
}

export interface IConnectionProfileGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
	inputBox: InputBox;
}

export interface IObjectExplorerTemplateData {
	root: HTMLElement;
	label: HTMLSpanElement;
	icon: HTMLElement;
	treeNode: TreeNode;
}