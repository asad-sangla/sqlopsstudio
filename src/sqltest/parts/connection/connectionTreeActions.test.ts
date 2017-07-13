/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import {
	RefreshAction, AddServerAction, DeleteConnectionAction, DisconnectConnectionAction,
	ActiveConnectionsFilterAction, RecentConnectionsFilterAction, ManageConnectionAction
}
	from 'sql/parts/registeredServer/viewlet/connectionTreeAction';
import { TestConnectionManagementService } from 'sqltest/stubs/connectionManagementService.test';
import { ErrorMessageServiceStub } from 'sqltest/stubs/errorMessageServiceStub';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { ServerTreeView } from 'sql/parts/registeredServer/viewlet/serverTreeView';
import * as Constants from 'sql/parts/connection/common/constants';
import { ObjectExplorerService, ObjectExplorerNodeEventArgs } from 'sql/parts/registeredServer/common/objectExplorerService';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { NodeType } from 'sql/parts/registeredServer/common/nodeType';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { ServerTreeDataSource } from 'sql/parts/registeredServer/viewlet/serverTreeDataSource';
import { Builder, $ } from 'vs/base/browser/builder';
import WinJS = require('vs/base/common/winjs.base');
import { Emitter } from 'vs/base/common/event';
import Severity from 'vs/base/common/severity';
import { ObjectExplorerActionsContext } from 'sql/parts/registeredServer/viewlet/objectExplorerActions';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionResult, IConnectionParams } from 'sql/parts/connection/common/connectionManagement';

suite('SQL Connection Tree Action tests', () => {
	let errorMessageService: TypeMoq.Mock<ErrorMessageServiceStub>;
	let conenctionProfile: IConnectionProfile = {
		authenticationType: '',
		databaseName: '',
		getOptionsKey: () => '',
		groupFullName: '',
		groupId: '',
		id: '',
		options: undefined,
		password: '',
		providerName: '',
		savePassword: true,
		saveProfile: true,
		serverName: '',
		userName: ''
	};
	let objectExplorerService: TypeMoq.Mock<TestConnectionManagementService>;
	let connectionResult: IConnectionResult = {
		connected: true,
		error: ''
	};
	setup(() => {
		errorMessageService = TypeMoq.Mock.ofType(ErrorMessageServiceStub, TypeMoq.MockBehavior.Loose);
		let nothing: void;
		errorMessageService.setup(x => x.showDialog(undefined, Severity.Error, TypeMoq.It.isAnyString(), TypeMoq.It.isAnyString())).returns(() => nothing);
	});

	function createConnectionManagementService(isConnectedReturnValue: boolean): TypeMoq.Mock<TestConnectionManagementService> {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Strict);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isConnected(undefined, TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);
		connectionManagementService.setup(x => x.connect(TypeMoq.It.isAny(), undefined, TypeMoq.It.isAny())).returns(() => Promise.resolve(connectionResult));
		connectionManagementService.setup(x => x.disconnect(TypeMoq.It.isAny())).returns(() => Promise.resolve(true));
		connectionManagementService.setup(x => x.findExistingConnection(TypeMoq.It.isAny())).returns(() => undefined);
		connectionManagementService.setup(x => x.showDashboard(TypeMoq.It.isAny())).returns(() => undefined);
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);
		connectionManagementService.setup(x => x.showConnectionDialog(undefined, TypeMoq.It.isAny())).returns(() => new Promise<void>((resolve, reject) => resolve()));
		connectionManagementService.setup(x => x.onConnect).returns(() => new Emitter<IConnectionParams>().event);
		connectionManagementService.setup(x => x.onDisconnect).returns(() => new Emitter<any>().event);
		connectionManagementService.setup(x => x.deleteConnectionGroup(TypeMoq.It.isAny())).returns(() => Promise.resolve(true));
		connectionManagementService.setup(x => x.deleteConnection(TypeMoq.It.isAny())).returns(() => Promise.resolve(true));

		return connectionManagementService;
	}

	function createObjectExplorerService(connectionManagementService: TestConnectionManagementService): TypeMoq.Mock<ObjectExplorerService> {
		let objectExplorerService = TypeMoq.Mock.ofType(ObjectExplorerService, TypeMoq.MockBehavior.Strict, connectionManagementService);
		objectExplorerService.callBase = true;
		objectExplorerService.setup(x => x.getObjectExplorerNode(TypeMoq.It.isAny())).returns(() => new TreeNode('', '', false, '', '', '', undefined, undefined));
		objectExplorerService.setup(x => x.getObjectExplorerNode(undefined)).returns(() => new TreeNode('', '', false, '', '', '', undefined, undefined));
		objectExplorerService.setup(x => x.onUpdateObjectExplorerNodes).returns(() => new Emitter<ObjectExplorerNodeEventArgs>().event);

		objectExplorerService.setup(x => x.onUpdateObjectExplorerNodes).returns(() => new Emitter<ObjectExplorerNodeEventArgs>().event);
		return objectExplorerService
	}

	test('ManageConnectionAction - test if connect is called when disconnected', (done) => {
		let isConnectedReturnValue: boolean = false;

		let connectionManagementService = createConnectionManagementService(isConnectedReturnValue);
		let objectExplorerService = createObjectExplorerService(connectionManagementService.object);

		let manageConnectionAction: ManageConnectionAction = new ManageConnectionAction(ManageConnectionAction.ID, ManageConnectionAction.LABEL, connectionManagementService.object, objectExplorerService.object);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: 'testId'
		});
		var actionContext = new ObjectExplorerActionsContext();
		actionContext.connectionProfile = connection;
		manageConnectionAction.run(actionContext).then((value) => {
			connectionManagementService.verify(x => x.connect(TypeMoq.It.isAny(), undefined, TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));

	});


	test('DisconnectConnectionAction - test if disconnect is called when profile is connected', (done) => {
		let isConnectedReturnValue: boolean = true;
		let connectionManagementService = createConnectionManagementService(isConnectedReturnValue);
		let objectExplorerService = createObjectExplorerService(connectionManagementService.object);

		let changeConnectionAction: DisconnectConnectionAction = new DisconnectConnectionAction(DisconnectConnectionAction.ID, DisconnectConnectionAction.LABEL, connectionManagementService.object, objectExplorerService.object, errorMessageService.object);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: 'testId'
		});
		var actionContext = new ObjectExplorerActionsContext();
		actionContext.connectionProfile = connection;
		changeConnectionAction.run(actionContext).then((value) => {
			connectionManagementService.verify(x => x.isProfileConnected(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			connectionManagementService.verify(x => x.disconnect(TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('AddServerAction - test if show connection dialog is called', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let connectionTreeAction: AddServerAction = new AddServerAction(AddServerAction.ID, AddServerAction.LABEL, connectionManagementService.object);
		let conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup', undefined, undefined);
		connectionTreeAction.run(conProfGroup).then((value) => {
			connectionManagementService.verify(x => x.showConnectionDialog(undefined, TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('ActiveConnectionsFilterAction - test if view is called to display filtered results', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Strict, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: ActiveConnectionsFilterAction = new ActiveConnectionsFilterAction(ActiveConnectionsFilterAction.ID, ActiveConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.showFilteredTree('active'), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('ActiveConnectionsFilterAction - test if view is called refresh results if action is toggled', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Loose, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: ActiveConnectionsFilterAction = new ActiveConnectionsFilterAction(ActiveConnectionsFilterAction.ID, ActiveConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.isSet = true;
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.refreshTree(), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('RecentConnectionsFilterAction - test if view is called to display filtered results', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Strict, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: RecentConnectionsFilterAction = new RecentConnectionsFilterAction(RecentConnectionsFilterAction.ID, RecentConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.showFilteredTree('recent'), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('RecentConnectionsFilterAction - test if view is called refresh results if action is toggled', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Strict, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: RecentConnectionsFilterAction = new RecentConnectionsFilterAction(RecentConnectionsFilterAction.ID, RecentConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.isSet = true;
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.refreshTree(), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('DeleteConnectionAction - test delete connection', (done) => {
		let connectionManagementService = createConnectionManagementService(true);

		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: 'testId'
		});
		let connectionAction: DeleteConnectionAction = new DeleteConnectionAction(DeleteConnectionAction.ID,
			DeleteConnectionAction.DELETE_CONNECTION_LABEL,
			connection,
			connectionManagementService.object);

		connectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.deleteConnection(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
		}).then(() => done(), (err) => done(err));

	});

	test('DeleteConnectionAction - test delete connection group', (done) => {
		let isConnectedReturnValue: boolean = false;
		let connectionManagementService = createConnectionManagementService(isConnectedReturnValue);
		let conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup', undefined, undefined);
		let connectionAction: DeleteConnectionAction = new DeleteConnectionAction(DeleteConnectionAction.ID,
			DeleteConnectionAction.DELETE_CONNECTION_LABEL,
			conProfGroup,
			connectionManagementService.object);

		connectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.deleteConnectionGroup(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
		}).then(() => done(), (err) => done(err));

	});

	test('DeleteConnectionAction - delete should not be called if connect is an unsaved connection', (done) => {
		let isConnectedReturnValue: boolean = false;
		let connectionManagementService = createConnectionManagementService(isConnectedReturnValue);

		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: 'testId'
		});
		connection.parent = new ConnectionProfileGroup(Constants.unsavedGroupLabel, undefined, Constants.unsavedGroupId, undefined, undefined);
		let connectionAction: DeleteConnectionAction = new DeleteConnectionAction(DeleteConnectionAction.ID,
			DeleteConnectionAction.DELETE_CONNECTION_LABEL,
			connection,
			connectionManagementService.object);

		assert.equal(connectionAction.enabled, false, 'delete action should be disabled.');
		done();
	});

	test('RefreshConnectionAction - refresh should be called if connection status is connect', (done) => {
		let isConnectedReturnValue: boolean = true;
		let sqlProvider = {
			protocolVersion: '1',
			providerName: 'MSSQL',
			providerDisplayName: 'MSSQL',
			connectionProvider: { options: [] },
			adminServicesProvider: { databaseInfoOptions: [], databaseFileInfoOptions: [], fileGroupInfoOptions: [] }
		};

		var connection = new ConnectionProfile(sqlProvider, {
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
		var conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup', undefined, undefined);
		conProfGroup.connections = [connection];
		var connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Strict);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.getConnectionGroups()).returns(() => [conProfGroup]);
		connectionManagementService.setup(x => x.getActiveConnections()).returns(() => [connection]);
		connectionManagementService.setup(x => x.addSavedPassword(TypeMoq.It.isAny())).returns(() => new Promise<ConnectionProfile>((resolve) => {
			resolve(connection);
		}));
		connectionManagementService.setup(x => x.isConnected(undefined, TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);

		var objectExplorerSession = {
			success: true,
			sessionId: '1234',
			rootNode: {
				nodePath: 'testServerName\tables',
				nodeType: NodeType.Folder,
				label: 'Tables',
				isLeaf: false,
				metadata: null,
				nodeSubType: '',
				nodeStatus: '',
				errorMessage: ''
			},
			errorMessage: ''
		};

		var tablesNode = new TreeNode(NodeType.Folder, 'Tables', false, 'testServerName\Db1\tables', '', '', null, null);
		tablesNode.connection = connection;
		tablesNode.session = objectExplorerSession;
		var table1Node = new TreeNode(NodeType.Table, 'dbo.Table1', false, 'testServerName\tables\dbo.Table1', '', '', tablesNode, null);
		var table2Node = new TreeNode(NodeType.Table, 'dbo.Table1', false, 'testServerName\tables\dbo.Table1', '', '', tablesNode, null);
		tablesNode.children = [table1Node, table2Node];
		let objectExplorerService = TypeMoq.Mock.ofType(ObjectExplorerService, TypeMoq.MockBehavior.Loose, connectionManagementService.object);
		objectExplorerService.callBase = true;
		objectExplorerService.setup(x => x.getObjectExplorerNode(TypeMoq.It.isAny())).returns(() => tablesNode);
		objectExplorerService.setup(x => x.refreshTreeNode(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as([table1Node, table2Node]));
		let builder: Builder = $().div();
		var dataSource = new ServerTreeDataSource(objectExplorerService.object, connectionManagementService.object, undefined);
		let tree = TypeMoq.Mock.ofType(Tree, TypeMoq.MockBehavior.Loose, builder.getHTMLElement(), { dataSource });
		tree.callBase = true;

		tree.setup(x => x.refresh(TypeMoq.It.isAny())).returns(() => WinJS.TPromise.as(null));
		tree.setup(x => x.expand(TypeMoq.It.isAny())).returns(() => WinJS.TPromise.as(null));
		let connectionAction: RefreshAction = new RefreshAction(RefreshAction.ID,
			RefreshAction.LABEL,
			tree.object,
			connection,
			connectionManagementService.object,
			objectExplorerService.object,
			undefined);

		connectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.isConnected(undefined, TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			objectExplorerService.verify(x => x.getObjectExplorerNode(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			objectExplorerService.verify(x => x.refreshTreeNode(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			tree.verify(x => x.refresh(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			tree.verify(x => x.expand(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
		}).then(() => done(), (err) => done(err));
	});

	test('RefreshConnectionAction - refresh should not be called if connection status is not connect', (done) => {
		let isConnectedReturnValue: boolean = false;
		let sqlProvider = {
			protocolVersion: '1',
			providerName: 'MSSQL',
			providerDisplayName: 'MSSQL',
			connectionProvider: { options: [] },
			adminServicesProvider: { databaseInfoOptions: [], databaseFileInfoOptions: [], fileGroupInfoOptions: [] }
		};

		var connection = new ConnectionProfile(sqlProvider, {
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
		var conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup', undefined, undefined);
		conProfGroup.connections = [connection];
		var connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Strict);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.getConnectionGroups()).returns(() => [conProfGroup]);
		connectionManagementService.setup(x => x.getActiveConnections()).returns(() => [connection]);
		connectionManagementService.setup(x => x.addSavedPassword(TypeMoq.It.isAny())).returns(() => new Promise<ConnectionProfile>((resolve) => {
			resolve(connection);
		}));
		connectionManagementService.setup(x => x.isConnected(undefined, TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);

		var objectExplorerSession = {
			success: true,
			sessionId: '1234',
			rootNode: {
				nodePath: 'testServerName\tables',
				nodeType: NodeType.Folder,
				label: 'Tables',
				isLeaf: false,
				metadata: null,
				nodeSubType: '',
				nodeStatus: '',
				errorMessage: ''
			},
			errorMessage: ''
		};

		var tablesNode = new TreeNode(NodeType.Folder, 'Tables', false, 'testServerName\Db1\tables', '', '', null, null);
		tablesNode.connection = connection;
		tablesNode.session = objectExplorerSession;
		var table1Node = new TreeNode(NodeType.Table, 'dbo.Table1', false, 'testServerName\tables\dbo.Table1', '', '', tablesNode, null);
		var table2Node = new TreeNode(NodeType.Table, 'dbo.Table1', false, 'testServerName\tables\dbo.Table1', '', '', tablesNode, null);
		tablesNode.children = [table1Node, table2Node];
		let objectExplorerService = TypeMoq.Mock.ofType(ObjectExplorerService, TypeMoq.MockBehavior.Loose, connectionManagementService.object);
		objectExplorerService.callBase = true;
		objectExplorerService.setup(x => x.getObjectExplorerNode(TypeMoq.It.isAny())).returns(() => tablesNode);
		objectExplorerService.setup(x => x.refreshTreeNode(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as([table1Node, table2Node]));
		let builder: Builder = $().div();
		var dataSource = new ServerTreeDataSource(objectExplorerService.object, connectionManagementService.object, undefined);
		let tree = TypeMoq.Mock.ofType(Tree, TypeMoq.MockBehavior.Loose, builder.getHTMLElement(), { dataSource });
		tree.callBase = true;

		tree.setup(x => x.refresh(TypeMoq.It.isAny())).returns(() => WinJS.TPromise.as(null));
		tree.setup(x => x.expand(TypeMoq.It.isAny())).returns(() => WinJS.TPromise.as(null));
		let connectionAction: RefreshAction = new RefreshAction(RefreshAction.ID,
			RefreshAction.LABEL,
			tree.object,
			connection,
			connectionManagementService.object,
			objectExplorerService.object,
			undefined);

		connectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.isConnected(undefined, TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			objectExplorerService.verify(x => x.getObjectExplorerNode(TypeMoq.It.isAny()), TypeMoq.Times.exactly(0));
			objectExplorerService.verify(x => x.refreshTreeNode(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.exactly(0));
			tree.verify(x => x.refresh(TypeMoq.It.isAny()), TypeMoq.Times.exactly(0));
			tree.verify(x => x.expand(TypeMoq.It.isAny()), TypeMoq.Times.exactly(0));
		}).then(() => done(), (err) => done(err));
	});

});