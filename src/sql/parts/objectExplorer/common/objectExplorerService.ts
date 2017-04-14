/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import { NodeType } from 'sql/parts/objectExplorer/common/nodeType';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import data = require('data');

export const SERVICE_ID = 'ObjectExplorerService';

export const IObjectExplorerService = createDecorator<IObjectExplorerService>(SERVICE_ID);

export interface IObjectExplorerService {
	_serviceBrand: any;

	createNewSession(providerId: string, connection: data.ConnectionInfo): Thenable<data.ObjectExplorerSession>;

	expandNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo>;

	/**
	 * Register a ObjectExplorer provider
	 */
	registerProvider(providerId: string, provider: data.ObjectExplorerProvider): void;

	getRootTreeNode(root: TreeNode, connections: ConnectionProfile): Promise<TreeNode>;

	createTreeRoot(): TreeNode;
}

export class ObjectExplorerService implements IObjectExplorerService {

	public _serviceBrand: any;

	private _disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ObjectExplorerProvider; } = Object.create(null);

	private _sessions: { [sessionId: string] : TreeNode } = {};

	constructor() {
	}

	public createNewSession(providerId: string, connection: data.ConnectionInfo): Thenable<data.ObjectExplorerSession> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.createNewSession(connection).then(result => {
				return result;
			}, error => {
				return undefined
			});
		}

		return Promise.resolve(undefined);
	}

	public expandNode(providerId: string, session: data.ObjectExplorerSession, nodePath: string): Thenable<data.ObjectExplorerExpandInfo> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.expandNode({
				sessionId: session.sessionId,
				nodePath: nodePath
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

	private expandTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode, databaseName: string): Thenable<TreeNode[]> {
		return this.expandNode('1', session, parentTree.nodePath).then(expandResult => {
			let children = expandResult.nodes.map(node => {
				/*
				if(node.nodeType === NodeType.Database) {
					if (node.label.toUpperCase() === databaseName.toUpperCase()) {
						return this.toTreeNode(node, parentTree);
					} else {
						return undefined;
					}
				} else {
					return this.toTreeNode(node, parentTree);
				}
				*/
				return this.toTreeNode(node, parentTree);
			});
			parentTree.children = children.filter(c => c !== undefined);
			return children;
		}, error => {

		});
	}

	private getDatabasesTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode, databaseName: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.expandTreeNode(session, parentTree, databaseName).then(children => {
				children.forEach(child => {
					if (!child.isAlwaysLeaf) {
						this.getDatabasesTreeNode(session, child, databaseName);
					}
				});
				resolve();
			});
		});
	}

	private toTreeNode(nodeInfo: data.NodeInfo, parent: TreeNode): TreeNode {
		return new TreeNode(nodeInfo.nodeType
			, nodeInfo.label,
			nodeInfo.isLeaf, nodeInfo.nodePath, parent);
	}

	public createTreeRoot(): TreeNode {
		return new TreeNode(NodeType.Root, 'root', false, 'root', null);
	}

	public getRootTreeNode(root: TreeNode, connection: ConnectionProfile): Promise<TreeNode> {
		return new Promise<TreeNode>((resolve, reject) => {
			let sessions: data.ObjectExplorerSession[];

			var children = [];
			root.children = children;

			this.createNewSession('1', connection).then(session => {
				if (session.rootNode.label in this._sessions) {
					resolve(root);
				} else {
					let server = this.toTreeNode(session.rootNode, root);
					server.connection = connection;
					this.getDatabasesTreeNode(session, server, connection.databaseName).then(() => {
						children.push(server);
						this._sessions[session.rootNode.label] = server;
						resolve(root);
					}, error => {
						reject(error);
					});
				}
			});
		});
	}
}