/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TreeNode } from 'sql/parts/objectExplorer/common/treeNode';
import { NodeType } from 'sql/parts/objectExplorer/common/nodeType';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

export class ObjectExplorerService {
	public static getDatabasesTreeNode(parentTree: TreeNode): void {
		// TreeNode constructor(id: string, label: string, isAlwaysLeaf:boolean, nodePath: string, parent: TreeNode)
		var databasesTree = new TreeNode(NodeType.Folder, 'Databases', false, parentTree.nodePath + '\\Databases', parentTree);
		parentTree.children = [databasesTree];

		var database1 = new TreeNode(NodeType.Database, 'keep_appetcht_dataCompare', false, databasesTree.nodePath + '\\keep_appetcht_dataCompare', databasesTree);
		databasesTree.children = [database1];

		var tableFolder = new TreeNode(NodeType.Folder, 'Tables', false, database1.nodePath + '\\Tables', database1);
		var viewFolder = new TreeNode(NodeType.Folder, 'Views', false, database1.nodePath + '\\Views', database1);
		database1.children = [tableFolder, viewFolder];

		var table1 = new TreeNode(NodeType.Table, 'dbo.CaseInsensitive', true, tableFolder.nodePath + '\\dbo.CaseInsensitive', tableFolder);
		table1.metadata = {
			metadataType: 0,
			metadataTypeName: 'Table',
			name: 'CaseInsensitive',
			schema: 'dbo'
		};
		var table2 = new TreeNode(NodeType.Table, 'dbo.Shippers2', true, tableFolder.nodePath + '\\dbo.Shippers2', tableFolder);
		table2.metadata = {
			metadataType: 0,
			metadataTypeName: 'Table',
			name: 'Shippers2',
			schema: 'dbo'
		};

		tableFolder.children = [table1, table2];

		var view1 = new TreeNode(NodeType.View, 'dbo.Shippers_View', true, viewFolder.nodePath + '\\dbo.Shippers_View', viewFolder);
		view1.metadata = {
			metadataType: 1,
			metadataTypeName: 'View',
			name: 'Shippers_View',
			schema: 'dbo'
		};
		viewFolder.children = [view1, new TreeNode(NodeType.View, 'View2', true, viewFolder.nodePath + '\\View2', viewFolder)];
	}

	public static getRootTreeNode(connections: ConnectionProfile[]): TreeNode {
		var children = [];
		var root = new TreeNode(NodeType.Root, 'root', false, 'root', null);
		root.children = children;

		connections.forEach((conn) => {
			let label = conn.serverName + ', ' +  conn.databaseName + ', ' + conn.providerName;
			let nodePath = conn.providerName + '\\' + conn.serverName + '\\' + conn.databaseName;
			let server = new TreeNode(NodeType.Server, label, false, nodePath, root);
			server.connection = conn;
			this.getDatabasesTreeNode(server);
			children.push(server);
		});
		return root;
	}
}