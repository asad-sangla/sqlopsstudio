/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ProviderConnectionInfo } from 'sql/parts/connection/common/providerConnectionInfo';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
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
		groupFullName: 'g2/g2-2',
		groupId: undefined,
		getUniqueId: undefined,
		providerName: 'MSSQL',
		options: undefined,
		saveProfile: true
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
				},
				{
					name: 'encrypt',
					displayName: undefined,
					description: undefined,
					groupName: undefined,
					categoryValues: undefined,
					defaultValue: undefined,
					isIdentity: false,
					isRequired: false,
					specialValueType: undefined,
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

	test('constructor should initialize the options given a valid model with options', () => {
		let options = {};
		options['encrypt'] = 'test value';
		let conn2 = Object.assign({}, connectionProfile, { options: options });
		let conn = new ProviderConnectionInfo(msSQLCapabilities, conn2);

		assert.equal(conn.serverName, conn2.serverName);
		assert.equal(conn.databaseName, conn2.databaseName);
		assert.equal(conn.authenticationType, conn2.authenticationType);
		assert.equal(conn.password, conn2.password);
		assert.equal(conn.userName, conn2.userName);
		assert.equal(conn.options['encrypt'], 'test value');
	});

	test('getUniqueId should create a valid unique id', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);
		let expectedId = 'providerName:MSSQL|authenticationType:|databaseName:database|serverName:new server|userName:user';
		let id = conn.getUniqueId();
		assert.equal(id, expectedId);
	});

	test('getUniqueId should create different id for different server names', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);
		let conn2 = new ProviderConnectionInfo(msSQLCapabilities, Object.assign({}, connectionProfile, { serverName: connectionProfile.serverName + '1' }));

		assert.notEqual(conn.getUniqueId(), conn2.getUniqueId());
	});

	test('titleParts should return server, database and auth type as first items', () => {
		let conn = new ProviderConnectionInfo(msSQLCapabilities, connectionProfile);
		let titleParts = conn.titleParts;
		assert.equal(titleParts.length, 4);
		assert.equal(titleParts[0], connectionProfile.serverName);
		assert.equal(titleParts[1], connectionProfile.databaseName);
		assert.equal(titleParts[2], connectionProfile.authenticationType);
		assert.equal(titleParts[3], connectionProfile.userName);
	});
});