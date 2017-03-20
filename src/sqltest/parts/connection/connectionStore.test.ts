/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as TypeMoq from 'typemoq';
import { ConnectionConfig } from 'sql/parts/connection/node/connectionconfig';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { WorkspaceConfigurationTestService } from 'sqltest/stubs/workspaceConfigurationTestService';
import * as Constants from 'sql/parts/connection/node/constants';
import { StorageTestService } from 'sqltest/stubs/storageTestService';
import { ConnectionStore } from 'sql/parts/connection/node/connectionStore';
import { CredentialsService } from 'sql/parts/credentials/credentialsService';
import * as assert from 'assert';
import { Memento } from 'vs/workbench/common/memento';
import * as Utils from 'sql/parts/connection/node/utils';
import { CapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import data = require('data');
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';

suite('SQL ConnectionStore tests', () => {
	let defaultNamedProfile: IConnectionProfile;
	let defaultUnnamedProfile: IConnectionProfile;
	let context: TypeMoq.Mock<Memento>;
	let credentialStore: TypeMoq.Mock<CredentialsService>;
	let connectionConfig: TypeMoq.Mock<ConnectionConfig>;
	let workspaceConfigurationServiceMock: TypeMoq.Mock<WorkspaceConfigurationTestService>;
	let storageServiceMock: TypeMoq.Mock<StorageTestService>;
	let capabilitiesService: TypeMoq.Mock<CapabilitiesService>;
	let mementoArray: any = [];
	let maxRecent = 5;
	let msSQLCapabilities: data.DataProtocolServerCapabilities;
	let defaultNamedConnectionProfile: ConnectionProfile;

	setup(() => {
		defaultNamedProfile = Object.assign({}, {
			serverName: 'namedServer',
			databaseName: 'bcd',
			authenticationType: 'SqlLogin',
			userName: 'cde',
			password: 'asdf!@#$',
			savePassword: true,
			groupId: '',
			groupName:'',
			getUniqueId: undefined,
			providerName: 'MSSQL'
		});

		defaultUnnamedProfile = Object.assign({}, {
			serverName: 'unnamedServer',
			databaseName: undefined,
			authenticationType: 'SqlLogin',
			userName: 'aUser',
			password: 'asdf!@#$',
			savePassword: true,
			groupId: '',
			groupName:'',
			getUniqueId: undefined,
			providerName: 'MSSQL'

		});

		let momento = new Memento('ConnectionManagement');
		context = TypeMoq.Mock.ofInstance(momento);
		context.setup(x => x.getMemento(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => mementoArray);

		credentialStore = TypeMoq.Mock.ofType(CredentialsService);
		connectionConfig = TypeMoq.Mock.ofType(ConnectionConfig);

		// setup configuration to return maxRecent for the #MRU items

		let configResult: { [key: string]: any } = {};
		configResult[Constants.configMaxRecentConnections] = maxRecent;

		workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		workspaceConfigurationServiceMock.setup(x => x.getConfiguration(Constants.extensionConfigSectionName))
			.returns(() => configResult);

		storageServiceMock = TypeMoq.Mock.ofType(StorageTestService);

		capabilitiesService = TypeMoq.Mock.ofType(CapabilitiesService);
		let capabilities: data.DataProtocolServerCapabilities[] = [];
		let connectionProvider: data.ConnectionProviderOptions = {
			options: [
				{
					name: 'serverName',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: true,
					isRequired: true,
					specialValueType: 0,
					valueType: 0
				},
				{
					name: 'databaseName',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: true,
					isRequired: true,
					specialValueType: 1,
					valueType: 0
				},
				{
					name: 'userName',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: true,
					isRequired: true,
					specialValueType: 3,
					valueType: 0
				},
				{
					name: 'authenticationType',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: true,
					isRequired: true,
					specialValueType: 2,
					valueType: 0
				},
				{
					name: 'password',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: true,
					isRequired: true,
					specialValueType: 4,
					valueType: 0
				}
			]
		};
		msSQLCapabilities = {
			protocolVersion: '1',
			providerName: 'MSSQL',
			providerDisplayName: 'MSSQL',
			connectionProvider: connectionProvider
		};
		capabilities.push(msSQLCapabilities);
		capabilitiesService.setup(x => x.getCapabilities()).returns(() => capabilities);
		connectionConfig.setup(x => x.getCapabilities('MSSQL')).returns(() => msSQLCapabilities);

		defaultNamedConnectionProfile = new ConnectionProfile(msSQLCapabilities, defaultNamedProfile);
	});

	test('addActiveConnection should not limit saves to the MaxRecentConnections amount', (done) => {
		// Given 3 is the max # creds
		let numCreds = 6;

		// setup memento for MRU to return a list we have access to
		credentialStore.setup(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
			.returns(() => Promise.resolve(true));

		// When saving 4 connections
		// Expect all of them to be saved even if size is limited to 3
		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, capabilitiesService.object, connectionConfig.object);
		let promise = Promise.resolve();
		for (let i = 0; i < numCreds; i++) {
			let cred = Object.assign({}, defaultNamedProfile, { serverName: defaultNamedProfile.serverName + i });
			let connectionProfile = new ConnectionProfile(msSQLCapabilities, cred);
			promise = promise.then(() => {
				return connectionStore.addActiveConnection(connectionProfile);
			}).then(() => {
				let current = connectionStore.getActiveConnections();
				assert.equal(current.length, i + 1, `expect all credentials to be saved ${current.length}|${i + 1} `);
				assert.equal(current[0].serverName, cred.serverName, 'Expect most recently saved item to be first in list');
				assert.ok(Utils.isEmpty(current[0].password));
			});
		}
		promise.then(() => {
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.exactly(numCreds));
			let recentConnections = connectionStore.getActiveConnections();
			assert.equal(numCreds, recentConnections.length);
			done();
		}, err => {
			// Must call done here so test indicates it's finished if errors occur
			done(err);
		});
	});

	test('addActiveConnection should add same connection exactly once', (done) => {
		// setup memento for MRU to return a list we have access to
		credentialStore.setup(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
			.returns(() => Promise.resolve(true));

		// Given we save the same connection twice
		// Then expect the only 1 instance of that connection to be listed in the MRU
		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, capabilitiesService.object, connectionConfig.object);
		connectionStore.clearActiveConnections();
		let promise = Promise.resolve();
		let cred = Object.assign({}, defaultNamedProfile, { serverName: defaultNamedProfile.serverName + 1 });
		let connectionProfile = new ConnectionProfile(msSQLCapabilities, cred);
		promise = promise.then(() => {
			return connectionStore.addActiveConnection(defaultNamedConnectionProfile);
		}).then(() => {
			return connectionStore.addActiveConnection(connectionProfile);
		}).then(() => {
			return connectionStore.addActiveConnection(connectionProfile);
		}).then(() => {
			let current = connectionStore.getActiveConnections();
			assert.equal(current.length, 2, 'expect 2 unique credentials to have been added');
			assert.equal(current[0].serverName, cred.serverName, 'Expect most recently saved item to be first in list');
			assert.ok(Utils.isEmpty(current[0].password));
		}).then(() => done(), err => done(err));
	});

	test('addActiveConnection should save password to credential store', (done) => {

		// Setup credential store to capture credentials sent to it
		let capturedCreds: any;
		credentialStore.setup(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
			.callback((cred: string, pass: any) => {
				capturedCreds = {
					'credentialId': cred,
					'password': pass
				};
			})
			.returns(() => Promise.resolve(true));

		// Given we save 1 connection with password and multiple other connections without
		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, capabilitiesService.object, connectionConfig.object);
		connectionStore.clearActiveConnections();
		let integratedCred = Object.assign({}, defaultNamedProfile, {
			serverName: defaultNamedProfile.serverName + 'Integrated',
			authenticationType: 'Integrated',
			userName: '',
			password: ''
		});
		let noPwdCred = Object.assign({}, defaultNamedProfile, {
			serverName: defaultNamedProfile.serverName + 'NoPwd',
			password: ''
		});
		let connectionProfile = new ConnectionProfile(msSQLCapabilities, defaultNamedProfile);

		let expectedCredCount = 0;
		let promise = Promise.resolve();
		promise = promise.then(() => {
			expectedCredCount++;
			return connectionStore.addActiveConnection(connectionProfile);
		}).then(() => {
			let current = connectionStore.getActiveConnections();
			// Then verify that since its password based we save the password
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.strictEqual(capturedCreds.password, defaultNamedProfile.password);
			let credId: string = capturedCreds.credentialId;
			assert.ok(credId.includes(ConnectionStore.CRED_MRU_USER), 'Expect credential to be marked as an MRU cred');
			assert.ok(Utils.isEmpty(current[0].password));
		}).then(() => {
			// When add integrated auth connection
			expectedCredCount++;
			let integratedCredConnectionProfile = new ConnectionProfile(msSQLCapabilities, integratedCred);
			return connectionStore.addActiveConnection(integratedCredConnectionProfile);
		}).then(() => {
			let current = connectionStore.getActiveConnections();
			// then expect no to have credential store called, but MRU count upped to 2
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.equal(current.length, expectedCredCount, `expect ${expectedCredCount} unique credentials to have been added`);
		}).then(() => {
			// When add connection without password
			expectedCredCount++;
			let noPwdCredConnectionProfile = new ConnectionProfile(msSQLCapabilities, noPwdCred);
			return connectionStore.addActiveConnection(noPwdCredConnectionProfile);
		}).then(() => {
			let current = connectionStore.getActiveConnections();
			// then expect no to have credential store called, but MRU count upped to 3
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.equal(current.length, expectedCredCount, `expect ${expectedCredCount} unique credentials to have been added`);
		}).then(() => done(), err => done(err));
	});

	test('can clear recent connections list', (done) => {
		connectionConfig.setup(x => x.getConnections(TypeMoq.It.isAny())).returns(() => []);

		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, capabilitiesService.object, connectionConfig.object);

		// When we clear the connections list and get the list of available connection items
		connectionStore.clearActiveConnections().then(() => {
			// Expect no connection items
			let result = connectionStore.getActiveConnections();
			let expectedCount = 0; // 1 for create connection profile
			assert.equal(result.length, expectedCount);

			// Then test is complete
			done();
		}, err => {
			done(err);
		});
	});
});