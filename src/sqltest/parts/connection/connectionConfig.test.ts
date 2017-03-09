/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import * as TypeMoq from 'typemoq';
import { ConnectionConfig } from 'sql/parts/connection/node/connectionconfig';
import { IConnectionProfile, IConnectionProfileStore } from 'sql/parts/connection/node/interfaces';
import { ConfigurationTarget, IConfigurationValue } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationValue } from 'vs/workbench/services/configuration/common/configuration';
import { WorkspaceConfigurationTestService } from 'sqltest/stubs/workspaceConfigurationTestService';
import { ConfigurationEditingService } from 'vs/workbench/services/configuration/node/configurationEditingService';
import * as Constants from 'sql/parts/connection/node/constants';
import { IConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { TPromise } from 'vs/base/common/winjs.base';
import * as assert from 'assert';

suite('ConnectionConfig tests', () => {
	let configValueToConcat: IWorkspaceConfigurationValue<IConnectionProfileGroup[]> = {
		workspace: [{
			name: 'g1',
			id: 'g1',
			parentId: ''
		},
		{
			name: 'g1-1',
			id: 'g1-1',
			parentId: 'g1'
		}
		],
		user: [{
			name: 'g2',
			id: 'g2',
			parentId: ''
		},
		{
			name: 'g2-1',
			id: 'g2-1',
			parentId: 'g2'
		},
		{
			name: 'g3',
			id: 'g3',
			parentId: ''
		},
		{
			name: 'g3-1',
			id: 'g3-1',
			parentId: 'g3'
		}
		],
		value: [],
		default: []
	};

	let configValueToMerge: IWorkspaceConfigurationValue<IConnectionProfileGroup[]> = {
		workspace: [
			{
				name: 'g1',
				id: 'g1',
				parentId: ''
			},
			{
				name: 'g1-1',
				id: 'g1-1',
				parentId: 'g1'
			}
		],
		user: [
			{
				name: 'g2',
				id: 'g2',
				parentId: ''
			},
			{
				name: 'g2-1',
				id: 'g2-1',
				parentId: 'g2'
			},
			{
				name: 'g1',
				id: 'g1',
				parentId: ''
			},
			{
				name: 'g1-2',
				id: 'g1-2',
				parentId: 'g1'
			}],
		value: [],
		default: []
	};

	let connections: IWorkspaceConfigurationValue<IConnectionProfileStore[]> = {
		workspace: [{
			options: {
				serverName: 'server1',
				databaseName: 'database',
				userName: 'user',
				password: 'password',
				authenticationType: ''
			},
			providerName: 'MSSQL',
			groupId: undefined
		}


		],
		user: [{
			options: {
				serverName: 'server2',
				databaseName: 'database',
				userName: 'user',
				password: 'password',
				authenticationType: ''
			},
			providerName: 'MSSQL',
			groupId: undefined
		}, {
			options: {
				serverName: 'server3',
				databaseName: 'database',
				userName: 'user',
				password: 'password',
				authenticationType: ''
			},
			providerName: 'MSSQL',
			groupId: undefined
		}
		],
		value: [

		],
		default: []
	};

	function groupsAreEqual(groups1: IConnectionProfileGroup[], groups2: IConnectionProfileGroup[]): Boolean {
		if (!groups1 && !groups2) {
			return true;
		} else if ((!groups1 && groups2 && groups2.length === 0) || (!groups2 && groups1 && groups1.length === 0)) {
			return true;
		}

		if (groups1.length !== groups2.length) {
			return false;
		}

		let areEqual = true;

		groups1.map(g1 => {
			if (areEqual) {
				let g2 = groups2.find(g => g.name === g1.name);
				if (!g2) {
					areEqual = false;
				} else {
					let result = groupsAreEqual(groups1.filter(a => a.parentId === g1.id), groups2.filter(b => b.parentId === g2.id));
					if (result === false) {
						areEqual = false;
					}
				}
			}
		});

		return areEqual;
	}

	test('allGroups should return groups from user and workspace settings', () => {

		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
			.returns(() => configValueToConcat);

		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		let allGroups = config.getAllGroups();


		assert.notEqual(allGroups, undefined);
		assert.equal(allGroups.length, configValueToConcat.workspace.length + configValueToConcat.user.length);
	});

	test('allGroups should merge groups from user and workspace settings', () => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let expectedAllGroups: IConnectionProfileGroup[] = [
			{
				name: 'g1',
				id: 'g1',
				parentId: ''
			},
			{
				name: 'g1-1',
				id: 'g1-1',
				parentId: 'g1'
			},
			{
				name: 'g2',
				id: 'g2',
				parentId: ''
			},
			{
				name: 'g2-1',
				id: 'g2-1',
				parentId: 'g2'
			},
			{
				name: 'g1-2',
				id: 'g1-2',
				parentId: 'g1'
			}];

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
			.returns(() => configValueToMerge);

		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		let allGroups = config.getAllGroups();


		assert.notEqual(allGroups, undefined);
		assert.equal(groupsAreEqual(allGroups, expectedAllGroups), true);
	});

	test('addConnection should add the new profile to user settings if does not exist', done => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let newProfile: IConnectionProfile = {
			serverName: 'new server',
			databaseName: 'database',
			userName: 'user',
			password: 'password',
			authenticationType: '',
			savePassword: true,
			groupName: undefined,
			groupId: undefined
		};

		let expectedNumberOfConnections = connections.user.length + 1;

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
			.returns(() => connections);
		let nothing: void;
		configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));


		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		config.addConnection(newProfile).then(success => {
			configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
				TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfileStore[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
			done();
		}).catch(error => {
			assert.fail();
			done();
		});
	});

	test('addConnection should not add the new profile to user settings if already exists', done => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let profileFromConfig = connections.user[0];
		let newProfile: IConnectionProfile = {
			serverName: profileFromConfig.options['serverName'],
			databaseName: profileFromConfig.options['databaseName'],
			userName: profileFromConfig.options['userName'],
			password: profileFromConfig.options['password'],
			authenticationType: profileFromConfig.options['authenticationType'],
			groupId: profileFromConfig.groupId,
			savePassword: true,
			groupName: undefined
		};

		let expectedNumberOfConnections = connections.user.length;

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
			.returns(() => connections);
		let nothing: void;
		configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));


		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		config.addConnection(newProfile).then(success => {
			configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
				TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfileStore[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
			done();
		}).catch(error => {
			assert.fail();
			done();
		});
	});

	test('addConnection should add the new group to user settings if does not exist', done => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let newProfile: IConnectionProfile = {
			serverName: 'new server',
			databaseName: 'database',
			userName: 'user',
			password: 'password',
			authenticationType: '',
			savePassword: true,
			groupName: 'g2/g2-2',
			groupId: undefined
		};

		let expectedNumberOfConnections = connections.user.length + 1;
		let expectedNumberOfGroups = configValueToConcat.user.length + 1;

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
			.returns(() => connections);
		let nothing: void;
		configEditingServiceMock.setup(x => x.writeConfiguration(ConfigurationTarget.USER, TypeMoq.It.isAny())).returns(() => TPromise.as<void>(nothing));
		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName))
			.returns(() => configValueToConcat);

		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		config.addConnection(newProfile).then(success => {
			configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
				TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfileStore[]).length === expectedNumberOfConnections)), TypeMoq.Times.once());
			configEditingServiceMock.verify(y => y.writeConfiguration(ConfigurationTarget.USER,
				TypeMoq.It.is<IConfigurationValue>(c => (c.value as IConnectionProfileGroup[]).length === expectedNumberOfGroups)), TypeMoq.Times.once());
			done();
		}).catch(error => {
			assert.fail();
			done();
		});
	});

	test('getConnections should return connections from user and workspace settings given getWorkspaceConnections set to true', () => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let getWorkspaceConnections: boolean = true;

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
			.returns(() => connections);



		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		let allConnections = config.getConnections(getWorkspaceConnections);
		assert.equal(allConnections.length, connections.user.length + connections.workspace.length);
	});

	test('getConnections should return connections from user settings given getWorkspaceConnections set to false', () => {
		let configEditingServiceMock = TypeMoq.Mock.ofType(ConfigurationEditingService);
		let workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		let getWorkspaceConnections: boolean = false;

		workspaceConfigurationServiceMock.setup(x => x.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(Constants.connectionsArrayName))
			.returns(() => connections);



		let config = new ConnectionConfig(configEditingServiceMock.object, workspaceConfigurationServiceMock.object);
		let allConnections = config.getConnections(getWorkspaceConnections);
		assert.equal(allConnections.length, connections.user.length);
	});
});

