/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';

import { TPromise } from 'vs/base/common/winjs.base';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import errors = require('vs/base/common/errors');

export class TreeUpdateUtils {

	public static isInDragAndDrop: boolean = false;

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
	public static registeredServerUpdate(tree: ITree, connectionManagementService: IConnectionManagementService, elementToSelect?: any): void {
		let selectedElement: any = elementToSelect;
		let targetsToExpand: any[];

		// Focus
		tree.DOMFocus();

		if (tree) {
			let selection = tree.getSelection();
			if (!selectedElement) {
				if (selection && selection.length === 1) {
					selectedElement = <any>selection[0];
				}
			}
			targetsToExpand = tree.getExpandedElements();
			if (selectedElement && targetsToExpand.indexOf(selectedElement) === -1) {
				targetsToExpand.push(selectedElement);
			}
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

	public static connectIfNotConnected(
		connection: ConnectionProfile,
		options: IConnectionCompletionOptions,
		connectionManagementService: IConnectionManagementService): TPromise<ConnectionProfile> {
		return new TPromise<ConnectionProfile>((resolve, reject) => {
			if (!connectionManagementService.isConnected(undefined, connection)) {
				connectionManagementService.connect(connection, undefined, options).then(result => {
					if (result.connected) {
						let existingConnection = connectionManagementService.findExistingConnection(connection);
						resolve(existingConnection);
					} else {
						reject('connection failed');
					}
				}, connectionError => {
					reject(connectionError);
				});
			} else {
				let existingConnection = connectionManagementService.findExistingConnection(connection);
				if (options && options.showDashboard) {
					connectionManagementService.showDashboard(connection).then((value) => {
						resolve(existingConnection);
					});
				} else {
					resolve(existingConnection);
				}
			}
		});
	}

	/**
	 * Makes a connection if the not already connected and try to create new object explorer session
	 * I the profile is already connected, tries to do the action requested in the options (e.g. open dashboard)
	 * Returns true if new object explorer session created for the connection, otherwise returns false
	 * @param connection Connection  Profile
	 * @param options Includes the actions to happened after connection is made
	 * @param connectionManagementService Connection management service instance
	 * @param objectExplorerService Object explorer service instance
	 */
	public static connectAndCreateOeSession(connection: ConnectionProfile, options: IConnectionCompletionOptions,
		connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TreeUpdateUtils.connectIfNotConnected(connection, options, connectionManagementService).then(connectedConnection => {
				var rootNode: TreeNode = objectExplorerService.getObjectExplorerNode(connectedConnection);
				if (!rootNode) {
					objectExplorerService.updateObjectExplorerNodes(connectedConnection).then(() => {
						rootNode = objectExplorerService.getObjectExplorerNode(connectedConnection);
						resolve(true);
						// The oe request is sent. an event will be raised when the session is created
					}, error => {
						reject('session failed');
					});
				} else {
					resolve(false);
				}
			}, connectionError => {
				reject(connectionError);
			});
		});
	}

	public static getObjectExplorerNode(connection: ConnectionProfile, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): TPromise<TreeNode[]> {
		return new TPromise<TreeNode[]>((resolve, reject) => {
			if (connection.isDisconnecting) {
				resolve([]);
			} else {
				var rootNode = objectExplorerService.getObjectExplorerNode(connection);
				if (rootNode) {
					objectExplorerService.expandTreeNode(rootNode.getSession(), rootNode).then(() => {
						resolve(rootNode.children);
					}, expandError => {
						resolve([]);
					});

				} else {
					resolve([]);
				}
			}
		});
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

	/**
	 *
	 * @param treeNode Returns true if the tree node is a database node
	 */
	public static isDatabaseNode(treeNode: TreeNode): boolean {
		return treeNode && treeNode.nodeTypeId === NodeType.Database;
	}

	/**
	 *
	 * @param treeNode Returns true if the tree node is an available database node
	 */
	public static isAvailableDatabaseNode(treeNode: TreeNode): boolean {
		return treeNode && treeNode.nodeTypeId === NodeType.Database && treeNode.nodeStatus !== 'Unavailable';
	}

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
}