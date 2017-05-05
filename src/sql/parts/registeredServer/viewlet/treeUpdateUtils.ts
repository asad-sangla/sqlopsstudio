/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import * as Constants from 'sql/parts/connection/common/constants';
import * as Utils from 'sql/parts/connection/common/utils';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { TPromise } from 'vs/base/common/winjs.base';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import errors = require('vs/base/common/errors');

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
					let uri = ConnectionFactory.DefaultUriPrefix + connectionProfile.getOptionsKey();
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
		let selectedElement: any;
		let targetsToExpand: any[];
		if (tree) {
			let selection = tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <any>selection[0];
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
		treeInput.addConnections(groups);
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
		let selectedElement: any;
		let targetsToExpand: any[];

		// Focus
		tree.DOMFocus();

		if (tree) {
			let selection = tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <any>selection[0];
			}
			targetsToExpand = tree.getExpandedElements();
		}

		let treeInput = TreeUpdateUtils.getTreeInput(connectionManagementService);
		if (treeInput) {
			if (treeInput !== tree.getInput()) {
				tree.setInput(treeInput).then(() => {
					// Make sure to expand all folders that where expanded in the previous session
					if (targetsToExpand) {
						tree.expandAll(targetsToExpand);
					}
					if (selectedElement) {
						tree.select(selectedElement);
					}
					tree.getFocus();
				}, errors.onUnexpectedError);
			}
		}
	}

	public static getTreeInput(connectionManagementService: IConnectionManagementService): ConnectionProfileGroup {

		let groups = connectionManagementService.getConnectionGroups();
		if (groups && groups.length > 0) {
			let treeInput = TreeUpdateUtils.addUnsaved(groups[0], connectionManagementService);
			treeInput.name = 'root';
			return treeInput;
		}
		// Should never get to this case.
		return undefined;
	}

	private static addUnsaved(root: ConnectionProfileGroup, connectionManagementService: IConnectionManagementService): ConnectionProfileGroup {
		let unsaved = new ConnectionProfileGroup(Constants.unsavedGroupLabel, root, Constants.unsavedGroupId);
		unsaved.addConnections(connectionManagementService.getUnsavedConnections());
		if (unsaved.connections.length >= 1) {
			root.addGroups([unsaved]);
		}
		return root;
	}

	public static hasObjectExplorerNode(connection: ConnectionProfile, connectionManagementService: IConnectionManagementService): boolean {
		return connectionManagementService.isConnected(undefined, connection);
	}

	public static getObjectExplorerNode(connection: ConnectionProfile, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): TPromise<TreeNode[]> {
		if (connectionManagementService.isConnected(undefined, connection)) {
			var rootNode = objectExplorerService.getObjectExplorerNode(connection);
			return new TPromise<TreeNode[]>((resolve) => {
				objectExplorerService.expandTreeNode(rootNode.getSession(), rootNode).then(() => {
					resolve(rootNode.children);
				});
			});
		} else {
			return TPromise.as(null);
		}
	}

	public static getObjectExplorerParent(objectExplorerNode: TreeNode, connectionManagementService: IConnectionManagementService): any {
		if (objectExplorerNode && objectExplorerNode.parent) {
			// if object explorer node's parent is root, return connection profile
			if (!objectExplorerNode.parent.parent) {
				var connectionUri = objectExplorerNode.getConnectionProfile().getOptionsKey();

				// get connection profile from connection profile groups
				let root = TreeUpdateUtils.getTreeInput(connectionManagementService);
				let connections = ConnectionProfileGroup.getConnectionsInGroup(root);
				let results = connections.filter(con => {
					if (connectionUri.includes(con.getOptionsKey())) {
						return true;
					} else {
						return false;
					}
				});
				if (results && results.length > 0) {
					return results[0];
				}
			} else {
				return objectExplorerNode.parent;
			}
		}
		return null;
	}
}