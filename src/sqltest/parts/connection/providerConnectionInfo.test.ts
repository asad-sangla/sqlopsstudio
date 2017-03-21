/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ProviderConnectionInfo } from 'sql/parts/connection/node/providerConnectionInfo';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import data = require('data');
import * as assert from 'assert';

suite('SQL ProviderConnectionInfo tests', () => {
	let msSQLCapabilities: data.DataProtocolServerCapabilities;

	let connectionProfile: IConnectionProfile = {
		serverName: 'new server',
		databaseName: 'database',
		userName: 'user',
		password: 'password',
		authenticationType: '',
		savePassword: true,
		groupName: 'g2/g2-2',
		groupId: undefined,
		getUniqueId: undefined,
		providerName: 'MSSQL',
		options: {}
	};

	setup(() => {
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
	});

	test('constructor should accept undefined parameters', () => {
		let conn = new ProviderConnectionInfo(undefined, undefined);
		assert.equal(conn.serverName, undefined);
	});

	test('set properties should set the values correctly', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, undefined);
		assert.equal(conn.serverName, undefined);
		conn.serverName = connectionProfile.serverName;
		conn.databaseName = connectionProfile.databaseName;
		conn.authenticationType = connectionProfile.authenticationType;
		conn.password = connectionProfile.password;
		conn.userName = connectionProfile.userName;
		assert.equal(conn.serverName, connectionProfile.serverName);
		assert.equal(conn.databaseName, connectionProfile.databaseName);
		assert.equal(conn.authenticationType, connectionProfile.authenticationType);
		assert.equal(conn.password, connectionProfile.password);
		assert.equal(conn.userName, connectionProfile.userName);
	});

	test('set properties should store the values in the options', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, undefined);
		assert.equal(conn.serverName, undefined);
		conn.serverName = connectionProfile.serverName;
		conn.databaseName = connectionProfile.databaseName;
		conn.authenticationType = connectionProfile.authenticationType;
		conn.password = connectionProfile.password;
		conn.userName = connectionProfile.userName;
		assert.equal(conn.getOptionValue('serverName'), connectionProfile.serverName);
		assert.equal(conn.getOptionValue('databaseName'), connectionProfile.databaseName);
		assert.equal(conn.getOptionValue('authenticationType'), connectionProfile.authenticationType);
		assert.equal(conn.getOptionValue('password'), connectionProfile.password);
		assert.equal(conn.getOptionValue('userName'), connectionProfile.userName);
	});

	test('constructor should initialize the options given a valid model', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);

		assert.equal(conn.serverName, connectionProfile.serverName);
		assert.equal(conn.databaseName, connectionProfile.databaseName);
		assert.equal(conn.authenticationType, connectionProfile.authenticationType);
		assert.equal(conn.password, connectionProfile.password);
		assert.equal(conn.userName, connectionProfile.userName);
	});

	test('clone should create a new instance that equals the old one', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);

		let conn2 = conn.clone();
		assert.equal(conn.serverName, conn2.serverName);
		assert.equal(conn.databaseName, conn2.databaseName);
		assert.equal(conn.authenticationType, conn2.authenticationType);
		assert.equal(conn.password, conn2.password);
		assert.equal(conn.userName, conn2.userName);
	});

	test('getUniqueId should create a valid unique id', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);
		let expectedId = 'MSSQL__database_new server_user_';
		let id = conn.getUniqueId();
		assert.equal(id, expectedId);
	});

	test('getUniqueId should create different id for different server names', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);
		let conn2 = new ProviderConnectionInfo(msSQLCapabilities, Object.assign({}, connectionProfile, { serverName: connectionProfile.serverName + '1' }));

		assert.notEqual(conn.getUniqueId(), conn2.getUniqueId());
	});
});