/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionStatusManager } from 'sql/parts/connection/common/connectionStatusManager';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import * as Constants from 'sql/parts/connection/common/constants';
import * as Utils from 'sql/parts/connection/common/utils';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';

import { IProgressService, IProgressRunner } from 'vs/platform/progress/common/progress';
import { TPromise } from 'vs/base/common/winjs.base';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import errors = require('vs/base/common/errors');

export class TreeSelectionHandler {
	progressRunner: IProgressRunner;

	constructor(@IProgressService private progressService: IProgressService) {

	}

	private onTreeActionStateChange(started: boolean): void {
		if (this.progressRunner) {
			this.progressRunner.done();
		}

		if (started) {
			this.progressRunner = this.progressService.show(true);
		} else {
			this.progressRunner = null;
		}
	}

	/**
	 * Handle selection of tree element
	 */
	public onTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService) {
		let selection = tree.getSelection();

		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			let connectionProfile = <ConnectionProfile>selection[0];
			let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
			let isDoubleClick = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
			if (isDoubleClick) {
				let callback: Promise<any>;
				this.onTreeActionStateChange(true);
				if (!connectionManagementService.isProfileConnected(connectionProfile)) {
					let options: IConnectionCompletionOptions = {
						params: undefined,
						saveTheConnection: false,
						showDashboard: true,
						showConnectionDialogOnError: false
					};
					callback = connectionManagementService.connect(connectionProfile, undefined, options);
				}
				else {
					let uri = ConnectionStatusManager.DefaultUriPrefix + connectionProfile.getOptionsKey();
					var connectionInfo = new ConnectionManagementInfo();
					connectionInfo.extensionTimer = new Utils.Timer();
					connectionInfo.intelliSenseTimer = new Utils.Timer();
					connectionInfo.connecting = true;
					connectionInfo.serviceTimer = new Utils.Timer();
					connectionInfo.connectionProfile = connectionProfile;
					if (connectionManagementService.getConnectionInfo(uri)) {
						connectionInfo.serverInfo = connectionManagementService.getConnectionInfo(uri).serverInfo;
					}
					callback = connectionManagementService.showDashboard(uri, connectionInfo);
				}
				callback.then(() => this.onTreeActionStateChange(false));
			}
		}
	}
}
export class TreeUpdateUtils {

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
		const treeInput = new ConnectionProfileGroup('root', null, undefined, undefined, undefined);
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
			let treeInput = groups[0];
			treeInput.name = 'root';
			return treeInput;
		}
		// Should never get to this case.
		return undefined;
	}

	public static hasObjectExplorerNode(connection: ConnectionProfile, connectionManagementService: IConnectionManagementService): boolean {
		let isConnected = connectionManagementService.isConnected(undefined, connection);
		return isConnected;
	}

	public static getObjectExplorerNode(connection: ConnectionProfile, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): TPromise<TreeNode[]> {
		if (connectionManagementService.isConnected(undefined, connection)) {
			var rootNode = objectExplorerService.getObjectExplorerNode(connection);
			if (rootNode) {
				return new TPromise<TreeNode[]>((resolve) => {
					objectExplorerService.expandTreeNode(rootNode.getSession(), rootNode).then(() => {
						resolve(rootNode.children);
					});
				});
			} else {
				return TPromise.as(null);
			}
		} else {
			return TPromise.as(null);
		}
	}

	public static getObjectExplorerParent(objectExplorerNode: TreeNode, connectionManagementService: IConnectionManagementService): any {
		if (objectExplorerNode && objectExplorerNode.parent) {
			// if object explorer node's parent is root, return connection profile
			if (!objectExplorerNode.parent.parent) {
				var connectionId = objectExplorerNode.getConnectionProfile().id;

				// get connection profile from connection profile groups
				let root = TreeUpdateUtils.getTreeInput(connectionManagementService);
				let connections = ConnectionProfileGroup.getConnectionsInGroup(root);
				let results = connections.filter(con => {
					if (connectionId === con.id) {
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