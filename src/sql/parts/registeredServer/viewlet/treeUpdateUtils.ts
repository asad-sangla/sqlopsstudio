/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';

import { IProgressService, IProgressRunner } from 'vs/platform/progress/common/progress';
import { TPromise } from 'vs/base/common/winjs.base';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import errors = require('vs/base/common/errors');

export class TreeSelectionHandler {
	progressRunner: IProgressRunner;

	private _clicks: number = 0;

	constructor( @IProgressService private progressService: IProgressService) {

	}

	public onTreeActionStateChange(started: boolean): void {
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
	public onTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService) {
		let isDoubleClick: boolean = false;
		let self = this;
		this._clicks++;

		setTimeout(function () {
			if (self._clicks === 1) {
				isDoubleClick = false;
			} else {
				isDoubleClick = true;
			}
			self.handleTreeItemSelected(isDoubleClick, event, tree, connectionManagementService, objectExplorerService);
			self._clicks = 0;
		}, 300);
	}

	private handleTreeItemSelected(isDoubleClick: boolean, event: any, tree: ITree, connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): void {
		let selection = tree.getSelection();
		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			let connectionProfile = <ConnectionProfile>selection[0];
			let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
			let isInDoubleClickBlock = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
			let options: IConnectionCompletionOptions = {
				params: undefined,
				saveTheConnection: false,
				showConnectionDialogOnError: true,
				showDashboard: isDoubleClick
			};
			if (!isInDoubleClickBlock) {
				this.onTreeActionStateChange(true);

				TreeUpdateUtils.connectAndCreateOeSession(connectionProfile, options, connectionManagementService, objectExplorerService).then(() => {
				}, error => {
					this.onTreeActionStateChange(false);
				});
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

	public static connectIfNotConnected(connection: ConnectionProfile, options: IConnectionCompletionOptions, connectionManagementService: IConnectionManagementService): TPromise<void> {
		return new TPromise<void>((resolve, reject) => {
			if (!connectionManagementService.isConnected(undefined, connection)) {
				connectionManagementService.connect(connection, undefined, options).then(result => {
					if (result.connected) {
						resolve(undefined);
					} else {
						reject('connection failed');
					}
				}, connectionError => {
					reject(connectionError);
				});
			} else {
				if (options && options.showDashboard) {
					connectionManagementService.showDashboard(connection).then((value) => {
						resolve(undefined);
					});
				} else {
					resolve(undefined);
				}
			}
		});
	}

	public static connectAndCreateOeSession(connection: ConnectionProfile, options: IConnectionCompletionOptions,
		connectionManagementService: IConnectionManagementService, objectExplorerService: IObjectExplorerService): TPromise<TreeNode> {
		return new TPromise<TreeNode>((resolve, reject) => {
			TreeUpdateUtils.connectIfNotConnected(connection, options, connectionManagementService).then(() => {
				var rootNode: TreeNode = objectExplorerService.getObjectExplorerNode(connection);
				if (!rootNode) {
					objectExplorerService.updateObjectExplorerNodes(connection).then(() => {
						rootNode = objectExplorerService.getObjectExplorerNode(connection);
						resolve(rootNode);
						// The oe request is sent. an event will be raised when the session is created
					}, error => {
						reject('session failed');
					});
				} else {
					resolve(rootNode);
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
}