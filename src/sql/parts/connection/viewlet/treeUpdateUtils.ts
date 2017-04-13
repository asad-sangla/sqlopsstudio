/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfileGroup } from '../common/connectionProfileGroup';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import * as Constants from 'sql/parts/connection/common/constants';
import * as Utils from 'sql/parts/connection/common/utils';

const $ = builder.$;
export class TreeUpdateUtils {

	/**
	 * Handle selection of tree element
	 */
	public static OnTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService) {
		let selection = tree.getSelection();

		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			let connectionProfile = <ConnectionProfile>selection[0];
			let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
			let isDoubleClick = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
			if (isDoubleClick) {
				if (!connectionManagementService.isProfileConnected(connectionProfile)) {
					let options: IConnectionCompletionOptions = {
						params: undefined,
						saveToSettings: false,
						showDashboard: true,
						showConnectionDialogOnError: false
					};
					connectionManagementService.connect(connectionProfile, undefined, options);
				}
				else {
					let uri = ConnectionFactory.DefaultUriPrefix + connectionProfile.getUniqueId();
					var connectionInfo = new ConnectionManagementInfo();
					connectionInfo.extensionTimer = new Utils.Timer();
					connectionInfo.intelliSenseTimer = new Utils.Timer();
					connectionInfo.connecting = true;
					connectionInfo.serviceTimer = new Utils.Timer();
					connectionInfo.connectionProfile = connectionProfile;
					if (connectionManagementService.getConnectionInfo(uri)) {
						connectionInfo.serverInfo = connectionManagementService.getConnectionInfo(uri).serverInfo;
					}
					connectionManagementService.showDashboard(uri, connectionInfo);
				}
			}
		}
	}

	/**
	 * Set input for the tree.
	 */
	public static structuralTreeUpdate(tree: ITree, viewKey: string, connectionManagementService: IConnectionManagementService): void {
		let selectedElement: TreeNode;
		let targetsToExpand: TreeNode[];
		if (tree) {
			let selection = tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <TreeNode>selection[0];
			}
			targetsToExpand = tree.getExpandedElements();
		}
		let groups;
		if (viewKey === 'recent') {
			groups = connectionManagementService.getRecentConnections();
		} else if (viewKey === 'active') {
			groups = connectionManagementService.getActiveConnections();
		}
		const treeInput = new ConnectionProfileGroup('root', null, undefined);
		treeInput.addConnections(TreeUpdateUtils.convertToConnectionProfile(groups));
		tree.setInput(treeInput).done(() => {
				// Make sure to expand all folders that where expanded in the previous session
 				if (targetsToExpand) {
 					tree.expandAll(targetsToExpand);
 				}
 				if (selectedElement) {
 					tree.select(selectedElement);
 				}
 				tree.getFocus();
		});
	}

	/**
	 * Set input for the registered servers tree.
	 */
	public static registeredServerUpdate(tree: ITree, connectionManagementService: IConnectionManagementService): void {
		let selectedElement: TreeNode;
		let targetsToExpand: TreeNode[];
		if (tree) {
			let selection = tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <TreeNode>selection[0];
			}
			targetsToExpand = tree.getExpandedElements();
		}
		let groups = connectionManagementService.getConnectionGroups();
		if (groups && groups.length > 0) {
			let treeInput = TreeUpdateUtils.addUnsaved(groups[0], connectionManagementService);
			treeInput.name = 'root';
			(treeInput !== tree.getInput() ?
				tree.setInput(treeInput) : tree.refresh()).done(() => {
				// Make sure to expand all folders that where expanded in the previous session
 				if (targetsToExpand) {
 					tree.expandAll(targetsToExpand);
 				}
 				if (selectedElement) {
 					tree.select(selectedElement);
 				}
					tree.getFocus();
				});
		}
	}

	private static addUnsaved(root: ConnectionProfileGroup, connectionManagementService: IConnectionManagementService): ConnectionProfileGroup {
		let unsaved = new ConnectionProfileGroup('Unsaved Connections', root, Constants.unsavedGroupId);
		unsaved.addConnections(connectionManagementService.getUnsavedConnections());
		if (unsaved.connections.length >= 1) {
			root.addGroups([unsaved]);
		}
		return root;
	}

	/**
	 * Convert interface to match connection management API
	 */
	public static convertToConnectionProfile(conns: ConnectionProfile[]): ConnectionProfile[] {
		let connections = [];

		conns.forEach((conn) => {
			connections.push(conn);
		});
		return connections;
	}
}