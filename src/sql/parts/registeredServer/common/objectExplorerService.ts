/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import data = require('data');

export const SERVICE_ID = 'ObjectExplorerService';

export const IObjectExplorerService = createDecorator<IObjectExplorerService>(SERVICE_ID);

export interface IObjectExplorerService {
	_serviceBrand: any;

	createNewSession(providerId: string, connection: data.ConnectionInfo): Thenable<data.ObjectExplorerSession>;

	closeSession(providerId: string, session: data.ObjectExplorerSession): Thenable<data.ObjectExplorerCloseSessionResponse>;

	expandNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo>;

	refreshNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo>;

	expandTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode): Thenable<TreeNode[]>;

	/**
	 * Register a ObjectExplorer provider
	 */
	registerProvider(providerId: string, provider: data.ObjectExplorerProvider): void;

	/* To do: remove this function once remove OE viewlet */
	getRootTreeNode(root: TreeNode, connections: ConnectionProfile): Promise<TreeNode>;

	createTreeRoot(): TreeNode;

	getTopLevelNode(connection: ConnectionProfile): TreeNode;

	updateObjectExplorerNodes(): Promise<void>[];

	deleteObjectExplorerNode(connection: IConnectionProfile): void;
}

export class ObjectExplorerService implements IObjectExplorerService {

	public _serviceBrand: any;

	private _disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ObjectExplorerProvider; } = Object.create(null);

	private _sessions: { [sessionId: string]: TreeNode } = {};

	private _activeOENode: { [id: string]: TreeNode };

	constructor(
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		this._activeOENode = {};
	}

	public updateObjectExplorerNodes(): Promise<void>[] {
		let connections = this._connectionManagementService.getActiveConnections();
		let promises = connections.map(connection => {
			return this._connectionManagementService.addSavedPassword(connection).then(withPassword => {
				let connectionProfile = ConnectionProfile.convertToConnectionProfile(connection.ServerCapabilities, withPassword);
				return this.updateNewObjectExplorerNode(connectionProfile);
			});
		});
		return promises;
	}

	public deleteObjectExplorerNode(connection: IConnectionProfile): void {
		delete this._activeOENode[connection.getOptionsKey()];
	}

	private updateNewObjectExplorerNode(connection: ConnectionProfile): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (this._activeOENode[connection.getOptionsKey()]) {
				resolve();
			} else {
				this.createNewSession(connection.providerName, connection).then(session => {
					if (session.sessionId in this._sessions) {
						resolve();
					} else {
						let server = this.toTreeNode(session.rootNode, null);
						server.connection = connection;
						server.session = session;
						this._activeOENode[connection.getOptionsKey()] = server;
						resolve();
					}
				});
			}
		});
	}

	public getTopLevelNode(connection: ConnectionProfile): TreeNode {
		return this._activeOENode[connection.getOptionsKey()];
	}

	public createNewSession(providerId: string, connection: data.ConnectionInfo): Thenable<data.ObjectExplorerSession> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.createNewSession(connection).then(result => {
				return result;
			}, error => {
				return undefined;
			});
		}

		return Promise.resolve(undefined);
	}

	public expandNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.expandNode({
				sessionId: session ? session.sessionId : undefined,
				nodePath: nodePath
			});
		}

		return Promise.resolve(undefined);
	}

	public refreshNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.refreshNode({
				sessionId: session ? session.sessionId : undefined,
				nodePath: nodePath
			});
		}

		return Promise.resolve(undefined);
	}

	public closeSession(providerId: string, session: data.ObjectExplorerSession): Thenable<data.ObjectExplorerCloseSessionResponse> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.closeSession({
				sessionId: session ? session.sessionId : undefined
			});
		}

		return Promise.resolve(undefined);
	}

	/**
	 * Register a ObjectExplorer provider
	 */
	public registerProvider(providerId: string, provider: data.ObjectExplorerProvider): void {
		this._providers[providerId] = provider;
	}

	public dispose(): void {
		this._disposables = dispose(this._disposables);
	}

	public expandTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode): Thenable<TreeNode[]> {
		return this.expandNode(parentTree.getConnectionProfile().providerName, session, parentTree.nodePath).then(expandResult => {
			let children = expandResult.nodes.map(node => {
				return this.toTreeNode(node, parentTree);
			});
			parentTree.children = children.filter(c => c !== undefined);
			return children;
		}, error => {

		});
	}

	private toTreeNode(nodeInfo: data.NodeInfo, parent: TreeNode): TreeNode {
		return new TreeNode(nodeInfo.nodeType
			, nodeInfo.label,
			nodeInfo.isLeaf, nodeInfo.nodePath, parent, nodeInfo.metadata);
	}

	public createTreeRoot(): TreeNode {
		let root = new TreeNode(NodeType.Root, 'root', false, 'root', null, null);
		root.children = [];
		return root;
	}

	public getRootTreeNode(root: TreeNode, connection: ConnectionProfile): Promise<TreeNode> {
		return new Promise<TreeNode>((resolve, reject) => {
			var children = root.children;

			this.createNewSession(connection.providerName, connection).then(session => {
				if (session.sessionId in this._sessions) {
					resolve(root);
				} else {
					let server = this.toTreeNode(session.rootNode, root);
					server.connection = connection;
					server.session = session;
					children.push(server);
					resolve(root);
				}
			});
		});
	}
}