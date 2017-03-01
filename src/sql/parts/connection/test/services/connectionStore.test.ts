/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as TypeMoq from 'typemoq';
import { ConnectionConfig } from 'sql/parts/connection/node/connectionconfig';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { WorkspaceConfigurationTestService } from './workspaceConfigurationTestService';
import * as Constants from 'sql/parts/connection/node/constants';
import { StorageTestService } from './storageTestService';
import { ConnectionStore } from 'sql/parts/connection/node/connectionStore';
import { CredentialsService } from 'sql/parts/credentials/credentialsService';
import * as assert from 'assert';
import { Memento } from 'vs/workbench/common/memento';
import * as Utils from 'sql/parts/connection/node/utils';

suite('ConnectionStore tests', () => {
	let defaultNamedProfile: IConnectionProfile;
	let defaultUnnamedProfile: IConnectionProfile;
	let context: TypeMoq.Mock<Memento>;
	let credentialStore: TypeMoq.Mock<CredentialsService>;
	let connectionConfig: TypeMoq.Mock<ConnectionConfig>;
	let workspaceConfigurationServiceMock: TypeMoq.Mock<WorkspaceConfigurationTestService>;
	let storageServiceMock: TypeMoq.Mock<StorageTestService>;
	let mementoArray: any = [];
	let maxRecent = 5;

	setup(() => {
		defaultNamedProfile = Object.assign({}, {
			serverName: 'namedServer',
			databaseName: 'bcd',
			authenticationType: 'SqlLogin',
			userName: 'cde',
			password: 'asdf!@#$',
			savePassword: true,
			groupName: ''
		});

		defaultUnnamedProfile = Object.assign({}, {
			serverName: 'unnamedServer',
			databaseName: undefined,
			authenticationType: 'SqlLogin',
			userName: 'aUser',
			password: 'asdf!@#$',
			savePassword: true,
			groupName: ''

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
	});

	test('addRecentlyUsed should limit saves to the MaxRecentConnections amount ', (done) => {
		// Given 3 is the max # creds
		let numCreds = 6;

		// setup memento for MRU to return a list we have access to
		credentialStore.setup(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
			.returns(() => Promise.resolve(true));

		// When saving 4 connections
		// Then expect the only the 3 most recently saved connections to be returned as size is limited to 3
		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, connectionConfig.object);
		let promise = Promise.resolve();
		for (let i = 0; i < numCreds; i++) {
			let cred = Object.assign({}, defaultNamedProfile, { serverName: defaultNamedProfile.serverName + i });
			promise = promise.then(() => {
				return connectionStore.addRecentlyUsed(cred);
			}).then(() => {
				let current = connectionStore.getRecentlyUsedConnections();
				if (i < maxRecent) {
					assert.equal(current.length, i + 1, `expect all credentials to be saved when limit not reached ${current.length}|${i + 1} `);
				} else {
					assert.equal(current.length, maxRecent, `expect only top ${maxRecent} creds to be saved`);
				}
				assert.equal(current[0].serverName, cred.serverName, 'Expect most recently saved item to be first in list');
				assert.ok(Utils.isEmpty(current[0].password));
			});
		}
		promise.then(() => {
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.exactly(numCreds));
			let recentConnections = connectionStore.getRecentlyUsedConnections();
			assert.equal(maxRecent, recentConnections.length);
			done();
		}, err => {
			// Must call done here so test indicates it's finished if errors occur
			done(err);
		});
	});

	test('addRecentlyUsed should add same connection exactly once', (done) => {
		// setup memento for MRU to return a list we have access to
		credentialStore.setup(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
			.returns(() => Promise.resolve(true));

		// Given we save the same connection twice
		// Then expect the only 1 instance of that connection to be listed in the MRU
		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, connectionConfig.object);
		connectionStore.clearRecentlyUsed();
		let promise = Promise.resolve();
		let cred = Object.assign({}, defaultNamedProfile, { serverName: defaultNamedProfile.serverName + 1 });
		promise = promise.then(() => {
			return connectionStore.addRecentlyUsed(defaultNamedProfile);
		}).then(() => {
			return connectionStore.addRecentlyUsed(cred);
		}).then(() => {
			return connectionStore.addRecentlyUsed(cred);
		}).then(() => {
			let current = connectionStore.getRecentlyUsedConnections();
			assert.equal(current.length, 2, 'expect 2 unique credentials to have been added');
			assert.equal(current[0].serverName, cred.serverName, 'Expect most recently saved item to be first in list');
			assert.ok(Utils.isEmpty(current[0].password));
		}).then(() => done(), err => done(err));
	});

	test('addRecentlyUsed should save password to credential store', (done) => {

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
			credentialStore.object, connectionConfig.object);
		connectionStore.clearRecentlyUsed();
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

		let expectedCredCount = 0;
		let promise = Promise.resolve();
		promise = promise.then(() => {
			expectedCredCount++;
			return connectionStore.addRecentlyUsed(defaultNamedProfile);
		}).then(() => {
			let current = connectionStore.getRecentlyUsedConnections();
			// Then verify that since its password based we save the password
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.strictEqual(capturedCreds.password, defaultNamedProfile.password);
			let credId: string = capturedCreds.credentialId;
			assert.ok(credId.includes(ConnectionStore.CRED_MRU_USER), 'Expect credential to be marked as an MRU cred');
			assert.ok(Utils.isEmpty(current[0].password));
		}).then(() => {
			// When add integrated auth connection
			expectedCredCount++;
			return connectionStore.addRecentlyUsed(integratedCred);
		}).then(() => {
			let current = connectionStore.getRecentlyUsedConnections();
			// then expect no to have credential store called, but MRU count upped to 2
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.equal(current.length, expectedCredCount, `expect ${expectedCredCount} unique credentials to have been added`);
		}).then(() => {
			// When add connection without password
			expectedCredCount++;
			return connectionStore.addRecentlyUsed(noPwdCred);
		}).then(() => {
			let current = connectionStore.getRecentlyUsedConnections();
			// then expect no to have credential store called, but MRU count upped to 3
			credentialStore.verify(x => x.saveCredential(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			assert.equal(current.length, expectedCredCount, `expect ${expectedCredCount} unique credentials to have been added`);
		}).then(() => done(), err => done(err));
	});

	test('can clear recent connections list', (done) => {
		connectionConfig.setup(x => x.getConnections(TypeMoq.It.isAny())).returns(() => []);

		let connectionStore = new ConnectionStore(storageServiceMock.object, context.object, undefined, workspaceConfigurationServiceMock.object,
			credentialStore.object, connectionConfig.object);

		// When we clear the connections list and get the list of available connection items
		connectionStore.clearRecentlyUsed().then(() => {
			// Expect no connection items
			let result = connectionStore.getRecentlyUsedConnections();
			let expectedCount = 0; // 1 for create connection profile
			assert.equal(result.length, expectedCount);

			// Then test is complete
			done();
		}, err => {
			done(err);
		});
	});
});