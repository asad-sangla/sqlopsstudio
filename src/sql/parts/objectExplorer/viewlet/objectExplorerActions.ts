/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { IConnectionManagementService, IConnectableInput, IConnectionCompletionOptions, ConnectionType } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';

export class NewQueryAction extends Action {
	public static ID = 'objectExplorer.newQuery';
	public static LABEL = localize('newQuery', 'New Query');
	private _objectExplorerTreeNode: TreeNode;
	get objectExplorerTreeNode(): TreeNode {
		return this._objectExplorerTreeNode;
	}
	set objectExplorerTreeNode(treeNode: TreeNode) {
		this._objectExplorerTreeNode = treeNode;
	}

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'object-explorer-action new-query';
		this.label = 'New Query';
	}

	public run(objectExplorerTreeNode: any): TPromise<boolean> {
		if (objectExplorerTreeNode instanceof TreeNode) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = objectExplorerTreeNode;
		}
		var connectionProfile = (<TreeNode>this._objectExplorerTreeNode).getConnectionProfile();
		var databaseName = (<TreeNode>this._objectExplorerTreeNode).getDatabaseName();
		if (databaseName !== undefined && connectionProfile.databaseName !== databaseName) {
			connectionProfile = connectionProfile.clone();
			connectionProfile.databaseName = databaseName;
		}

		this.queryEditorService.newSqlEditor().then((owner: IConnectableInput) => {
			// Connect our editor to the input connection
			let options: IConnectionCompletionOptions = {
				params: { connectionType: ConnectionType.editor, runQueryOnCompletion: false, input: owner },
				saveToSettings: false,
				showDashboard: false,
				showConnectionDialogOnError: true
			};
			this.connectionManagementService.connect(connectionProfile, owner.uri, options);
		});
		return TPromise.as(true);
	}
}

export class DisconnectAction extends Action {
	public static ID = 'objectExplorer.disconnect';
	public static LABEL = localize('disconnect', 'Disconnect');
	private _objectExplorerTreeNode: TreeNode;

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
		this.class = 'object-explorer-action new-query';
		this.label = 'Disconnect';
	}

	public run(objectExplorerTreeNode: any): TPromise<boolean> {
		if (objectExplorerTreeNode instanceof TreeNode) {
			//set objectExplorerTreeNode for context menu clicks
			this._objectExplorerTreeNode = objectExplorerTreeNode;
		}
		var connectionProfile = (<TreeNode>this._objectExplorerTreeNode).getConnectionProfile();
		if (this.connectionManagementService.isProfileConnected(connectionProfile)) {
			this.connectionManagementService.disconnectProfile(connectionProfile);
		}

		return TPromise.as(true);
	}
}