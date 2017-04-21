/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';
import { ITree } from 'vs/base/parts/tree/browser/tree';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';
import { AddServerAction, NewQueryAction, RenameGroupAction, DeleteConnectionAction, ChangeConnectionAction, ActiveConnectionsFilterAction, RecentConnectionsFilterAction } from 'sql/parts/connection/viewlet/connectionTreeAction';
import { TestConnectionManagementService } from 'sqltest/stubs/connectionManagementService.test';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { ServerTreeView } from 'sql/parts/connection/viewlet/serverTreeView';
import * as Constants from 'sql/parts/connection/common/constants';

suite('SQL Connection Tree Action tests', () => {

	setup(() => {
	});

	test('ChangeConnectionAction - test if connect is called when disconnected', (done) => {
		let isConnectedReturnValue: boolean = false;
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);

		let changeConnectionAction: ChangeConnectionAction = new ChangeConnectionAction(connectionManagementService.object);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getUniqueId: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true
		});
		changeConnectionAction.connectionProfile = connection;
		changeConnectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.isProfileConnected(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			connectionManagementService.verify(x => x.connect(TypeMoq.It.isAny(), undefined, TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));

	});


	test('ChangeConnectionAction - test if disconnect is called when profile is connected', (done) => {
		let isConnectedReturnValue: boolean = true;
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);

		let changeConnectionAction: ChangeConnectionAction = new ChangeConnectionAction(connectionManagementService.object);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getUniqueId: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true
		});
		changeConnectionAction.connectionProfile = connection;
		changeConnectionAction.run().then((value) => {
			connectionManagementService.verify(x => x.isProfileConnected(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
			connectionManagementService.verify(x => x.disconnectProfile(TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('AddServerAction - test if show connection dialog is called', (done) => {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.showConnectionDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => new Promise<void>((resolve, reject) => { resolve(); }));

		let connectionTreeAction: AddServerAction = new AddServerAction(AddServerAction.ID, AddServerAction.LABEL, connectionManagementService.object);
		let conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup');
		connectionTreeAction.run(conProfGroup).then((value) => {
			connectionManagementService.verify(x => x.showConnectionDialog(undefined, TypeMoq.It.isAny()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('ActiveConnectionsFilterAction - test if view is called to display filtered results', (done) => {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Loose, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: ActiveConnectionsFilterAction = new ActiveConnectionsFilterAction(ActiveConnectionsFilterAction.ID, ActiveConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.showFilteredTree('active'), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('ActiveConnectionsFilterAction - test if view is called refresh results if action is toggled', (done) => {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Loose, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: ActiveConnectionsFilterAction = new ActiveConnectionsFilterAction(ActiveConnectionsFilterAction.ID, ActiveConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.isSet = true;
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.refreshTree(), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('RecentConnectionsFilterAction - test if view is called to display filtered results', (done) => {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Loose, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: RecentConnectionsFilterAction = new RecentConnectionsFilterAction(RecentConnectionsFilterAction.ID, RecentConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.showFilteredTree('recent'), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('RecentConnectionsFilterAction - test if view is called refresh results if action is toggled', (done) => {
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;

		let instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve({}));
		});

		let serverTreeView = TypeMoq.Mock.ofType(ServerTreeView, TypeMoq.MockBehavior.Loose, {}, {}, undefined, instantiationService.object, undefined, undefined, undefined);
		serverTreeView.setup(x => x.showFilteredTree(TypeMoq.It.isAnyString()));
		serverTreeView.setup(x => x.refreshTree());
		let connectionTreeAction: RecentConnectionsFilterAction = new RecentConnectionsFilterAction(RecentConnectionsFilterAction.ID, RecentConnectionsFilterAction.LABEL, serverTreeView.object, connectionManagementService.object);
		connectionTreeAction.isSet = true;
		connectionTreeAction.run().then((value) => {
			serverTreeView.verify(x => x.refreshTree(), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('DeleteConnectionAction - test delete connection', (done) => {
		let isConnectedReturnValue: boolean = false;
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getUniqueId: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true
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
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);
		let conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup');
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
		let connectionManagementService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isProfileConnected(TypeMoq.It.isAny())).returns(() => isConnectedReturnValue);
		let connection: ConnectionProfile = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'integrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getUniqueId: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true
		});
		connection.parent = new ConnectionProfileGroup(Constants.unsavedGroupLabel, undefined, Constants.unsavedGroupId);
		let connectionAction: DeleteConnectionAction = new DeleteConnectionAction(DeleteConnectionAction.ID,
			DeleteConnectionAction.DELETE_CONNECTION_LABEL,
			connection,
			connectionManagementService.object);

		assert.equal(connectionAction.enabled, false, 'delete action should be disabled.');
		done();
	});

});