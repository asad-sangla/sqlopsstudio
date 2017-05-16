/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import Event, { Emitter } from 'vs/base/common/event';
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

	refreshTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode): Thenable<TreeNode[]>;

	/**
	 * Register a ObjectExplorer provider
	 */
	registerProvider(providerId: string, provider: data.ObjectExplorerProvider): void;

	getObjectExplorerNode(connection: IConnectionProfile): TreeNode;

	updateObjectExplorerNodes(connectionProfile: IConnectionProfile): Promise<void>;

	deleteObjectExplorerNode(connection: IConnectionProfile): void;

	onUpdateObjectExplorerNodes: Event<IConnectionProfile>;
}

export class ObjectExplorerService implements IObjectExplorerService {

	public _serviceBrand: any;

	private _disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ObjectExplorerProvider; } = Object.create(null);

	private _activeObjectExplorerNodes: { [id: string]: TreeNode };

	private _onUpdateObjectExplorerNodes: Emitter<IConnectionProfile>;

	constructor(
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		this._onUpdateObjectExplorerNodes = new Emitter<IConnectionProfile>();
		this._activeObjectExplorerNodes = {};
	}

	public get onUpdateObjectExplorerNodes(): Event<IConnectionProfile> {
		return this._onUpdateObjectExplorerNodes.event;
	}
	public updateObjectExplorerNodes(connection: IConnectionProfile): Promise<void> {
		return this._connectionManagementService.addSavedPassword(connection).then(withPassword => {
			let connectionProfile = ConnectionProfile.convertToConnectionProfile(
				this._connectionManagementService.getCapabilities(connection.providerName), withPassword);
			return this.updateNewObjectExplorerNode(connectionProfile);
		});
	}

	public deleteObjectExplorerNode(connection: IConnectionProfile): void {
		var connectionUri = connection.id;
		var nodeTree = this._activeObjectExplorerNodes[connectionUri];
		this.closeSession(connection.providerName, nodeTree.getSession()).then(() => {
			delete this._activeObjectExplorerNodes[connectionUri];
		});
	}

	private updateNewObjectExplorerNode(connection: ConnectionProfile): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (this._activeObjectExplorerNodes[connection.id]) {
				this._onUpdateObjectExplorerNodes.fire(<IConnectionProfile>connection);
				resolve();
			} else {
				this.createNewSession(connection.providerName, connection).then(session => {
					if (session && session.success && session.rootNode) {
						let server = this.toTreeNode(session.rootNode, null);
						server.connection = connection;
						server.session = session;
						this._activeObjectExplorerNodes[connection.id] = server;
					} else {
						// TODO: show the error
					}
					this._onUpdateObjectExplorerNodes.fire(<IConnectionProfile>connection);
					resolve();

				});
			}
		});
	}

	public getObjectExplorerNode(connection: IConnectionProfile): TreeNode {
		return this._activeObjectExplorerNodes[connection.id];
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
			let children: TreeNode[] = [];
			if (expandResult.nodes) {
				children = expandResult.nodes.map(node => {
					return this.toTreeNode(node, parentTree);
				});
				parentTree.children = children.filter(c => c !== undefined);
			}
			return children;

		}, error => {

		});
	}

	public refreshTreeNode(session: data.ObjectExplorerSession, parentTree: TreeNode): Thenable<TreeNode[]> {
		return this.refreshNode(parentTree.getConnectionProfile().providerName, session, parentTree.nodePath).then(expandResult => {
			let children = expandResult.nodes.map(node => {
				return this.toTreeNode(node, parentTree);
			});
			parentTree.children = children.filter(c => c !== undefined);
			return children;
		}, error => {

		});
	}

	private toTreeNode(nodeInfo: data.NodeInfo, parent: TreeNode): TreeNode {
		return new TreeNode(nodeInfo.nodeType, nodeInfo.label, nodeInfo.isLeaf, nodeInfo.nodePath,
			nodeInfo.nodeSubType, nodeInfo.nodeStatus, parent, nodeInfo.metadata);
	}
}