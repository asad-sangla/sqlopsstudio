/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { ObjectExplorerProviderTestService } from 'sqltest/stubs/objectExplorerProviderTestService';
import { TestConnectionManagementService } from 'sqltest/stubs/connectionManagementService.test';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { TPromise } from 'vs/base/common/winjs.base';
import data = require('data');
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('Object Explorer Service tests', () => {
	var sqlOEProvider: TypeMoq.Mock<ObjectExplorerProviderTestService>;
	let connectionManagementService: TypeMoq.Mock<TestConnectionManagementService>;
	let connection: ConnectionProfile;
	let conProfGroup: ConnectionProfileGroup;
	let objectExplorerService: ObjectExplorerService;
	let objectExplorerSession: data.ObjectExplorerSession;
	let objectExplorerCloseSessionResponse: data.ObjectExplorerCloseSessionResponse;
	let objectExplorerExpandInfo: data.ObjectExplorerExpandInfo;
	let objectExplorerExpandInfoRefresh: data.ObjectExplorerExpandInfo;

	setup(() => {
		let sessionId = '1234';
		let NodeInfoTable1 = {
			nodePath: 'testServerName\tables\dbo.Table1',
			nodeType: NodeType.Table,
			label: 'dbo.Table1',
			isLeaf: false,
			metadata: null,
			nodeSubType: '',
			nodeStatus: ''
		};
		let NodeInfoTable2 = {
			nodePath: 'testServerName\tables\dbo.Table2',
			nodeType: NodeType.Table,
			label: 'dbo.Table2',
			isLeaf: false,
			metadata: null,
			nodeSubType: '',
			nodeStatus: ''
		};

		let NodeInfoTable3 = {
			nodePath: 'testServerName\tables\dbo.Table3',
			nodeType: NodeType.Table,
			label: 'dbo.Table3',
			isLeaf: false,
			metadata: null,
			nodeSubType: '',
			nodeStatus: ''
		};

		objectExplorerSession = {
			success: true,
			sessionId: sessionId,
			rootNode: {
				nodePath: 'testServerName\tables',
				nodeType: NodeType.Folder,
				label: 'Tables',
				isLeaf: false,
				metadata: null,
				nodeSubType: '',
				nodeStatus: ''
			}
		};

		objectExplorerCloseSessionResponse = {
			success: true,
			sessionId: sessionId,
		};

		objectExplorerExpandInfo = {
			sessionId: sessionId,
			nodes: [NodeInfoTable1, NodeInfoTable2]
		};

		objectExplorerExpandInfoRefresh = {
			sessionId: sessionId,
			nodes: [NodeInfoTable1, NodeInfoTable3]
		};

		sqlOEProvider = TypeMoq.Mock.ofType(ObjectExplorerProviderTestService, TypeMoq.MockBehavior.Loose);
		sqlOEProvider.callBase = true;
		sqlOEProvider.setup(x => x.createNewSession(TypeMoq.It.isAny())).returns(() => TPromise.as(objectExplorerSession));
		sqlOEProvider.setup(x => x.expandNode(TypeMoq.It.isAny())).returns(() => TPromise.as(objectExplorerExpandInfo));
		sqlOEProvider.setup(x => x.refreshNode(TypeMoq.It.isAny())).returns(() => TPromise.as(objectExplorerExpandInfoRefresh));
		sqlOEProvider.setup(x => x.closeSession(TypeMoq.It.isAny())).returns(() => TPromise.as(objectExplorerCloseSessionResponse));

		let sqlProvider = {
			protocolVersion: '1',
			providerName: 'MSSQL',
			providerDisplayName: 'MSSQL',
			connectionProvider: { options: [] },
			adminServicesProvider: { databaseInfoOptions:[], databaseFileInfoOptions: [], fileGroupInfoOptions: [] }
		};

		connection = new ConnectionProfile(sqlProvider, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'inetgrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: 'testID'
		});
		conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup');
		conProfGroup.connections = [connection];
		connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Strict);
		connectionManagementService.setup(x => x.getConnectionGroups()).returns(() => [conProfGroup]);
		connectionManagementService.setup(x => x.getActiveConnections()).returns(() => [connection]);
		connectionManagementService.setup(x => x.addSavedPassword(TypeMoq.It.isAny())).returns(() => new Promise<ConnectionProfile>((resolve) => {
			resolve(connection);
		}));

		objectExplorerService = new ObjectExplorerService(connectionManagementService.object);
		objectExplorerService.registerProvider('MSSQL', sqlOEProvider.object);
	});

	test('create new session should create session successfully', () => {
		objectExplorerService.createNewSession('MSSQL', connection).then(session => {
			assert.equal(session !== null || session !== undefined, true);
			assert.equal(session.success, true);
			assert.equal(session.sessionId, '1234');
		});
	});

	test('close session should close session successfully', () => {
		objectExplorerService.closeSession('MSSQL', objectExplorerSession).then(session => {
			assert.equal(session !== null || session !== undefined, true);
			assert.equal(session.success, true);
			assert.equal(session.sessionId, '1234');
		});
	});

	test('expand node should expand node correctly', () => {
		objectExplorerService.expandNode('MSSQL', objectExplorerSession, 'testServerName\tables').then(expandInfo => {
			assert.equal(expandInfo !== null || expandInfo !== undefined, true);
			assert.equal(expandInfo.sessionId, '1234');
			assert.equal(expandInfo.nodes.length, 2);
			var children = expandInfo.nodes;
			assert.equal(children[0].label, 'dbo.Table1');
			assert.equal(children[1].label, 'dbo.Table2');
		});
	});

	test('refresh node should refresh node correctly', () => {
		objectExplorerService.refreshNode('MSSQL', objectExplorerSession, 'testServerName\tables').then(expandInfo => {
			assert.equal(expandInfo !== null || expandInfo !== undefined, true);
			assert.equal(expandInfo.sessionId, '1234');
			assert.equal(expandInfo.nodes.length, 2);
			var children = expandInfo.nodes;
			assert.equal(children[0].label, 'dbo.Table1');
			assert.equal(children[1].label, 'dbo.Table3');
		});
	});

	test('expand tree node should children correctly', () => {
		var tablesNode = new TreeNode(NodeType.Folder, 'Tables', false, 'testServerName\tables', '', '', null, null);
		tablesNode.connection = connection;
		objectExplorerService.expandTreeNode(objectExplorerSession, tablesNode).then(children => {
			assert.equal(children !== null || children !== undefined, true);
			assert.equal(children[0].label, 'dbo.Table1');
			assert.equal(children[0].parent, tablesNode);
			assert.equal(children[0].nodePath, 'testServerName\tables\dbo.Table1');
			assert.equal(children[1].label, 'dbo.Table2');
			assert.equal(children[1].parent, tablesNode);
			assert.equal(children[1].nodePath, 'testServerName\tables\dbo.Table2');
		});
	});

	test('refresh tree node should children correctly', () => {
		var tablesNode = new TreeNode(NodeType.Folder, 'Tables', false, 'testServerName\tables', '', '', null, null);
		tablesNode.connection = connection;
		objectExplorerService.refreshTreeNode(objectExplorerSession, tablesNode).then(children => {
			assert.equal(children !== null || children !== undefined, true);
			assert.equal(children[0].label, 'dbo.Table1');
			assert.equal(children[0].parent, tablesNode);
			assert.equal(children[0].nodePath, 'testServerName\tables\dbo.Table1');
			assert.equal(children[1].label, 'dbo.Table3');
			assert.equal(children[1].parent, tablesNode);
			assert.equal(children[1].nodePath, 'testServerName\tables\dbo.Table3');
		});
	});

	test('update object explorer nodes should get active connection, create session, add to the active OE nodes successfully', () => {
		Promise.all(objectExplorerService.updateObjectExplorerNodes()).then(() => {
			var treeNode = objectExplorerService.getObjectExplorerNode(connection);
			assert.equal(treeNode !== null || treeNode !== undefined, true);
			assert.equal(treeNode.getSession(), objectExplorerSession);
			assert.equal(treeNode.getConnectionProfile(), connection);
			assert.equal(treeNode.label, 'Tables');
			assert.equal(treeNode.nodePath, 'testServerName\tables');
		});
	});

	test('delete object explorerNode nodes should delete session, delete the root node to the active OE node', () => {
		Promise.all(objectExplorerService.updateObjectExplorerNodes()).then(() => {
			var treeNode = objectExplorerService.getObjectExplorerNode(connection);
			assert.equal(treeNode !== null || treeNode !== undefined, true);
			objectExplorerService.deleteObjectExplorerNode(connection);
			treeNode = objectExplorerService.getObjectExplorerNode(connection);
			assert.equal(treeNode === null || treeNode === undefined, true);
		});
	});

	test('children tree nodes should return correct object explorer session, connection profile and database name', () => {
		var databaseMetaData = {
			metadataType: 0,
			metadataTypeName: 'Database',
			name: 'Db1',
			schema: null
		};
		var databaseNode = new TreeNode(NodeType.Database, 'Db1', false, 'testServerName\Db1', '', '', null, databaseMetaData);
		databaseNode.connection = connection;
		databaseNode.session = objectExplorerSession;
		var tablesNode = new TreeNode(NodeType.Folder, 'Tables', false, 'testServerName\Db1\tables', '', '', databaseNode, null);
		databaseNode.children = [tablesNode];
		var table1Node = new TreeNode(NodeType.Table, 'dbo.Table1', false, 'testServerName\Db1\tables\dbo.Table1', '', '', tablesNode, null);
		var table2Node = new TreeNode(NodeType.Table, 'dbo.Table2', false, 'testServerName\Db1\tables\dbo.Table2', '', '', tablesNode, null);
		tablesNode.children = [table1Node, table2Node];
		assert.equal(table1Node.getSession(), objectExplorerSession);
		assert.equal(table1Node.getConnectionProfile(), connection);
		assert.equal(table1Node.getDatabaseName(), 'Db1');
	});
});