/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import data = require('data');
import * as assert from 'assert';

suite('SQL ConnectionProfileInfo tests', () => {
	let msSQLCapabilities: data.DataProtocolServerCapabilities;

	let connectionProfile: IConnectionProfile = {
		serverName: 'new server',
		databaseName: 'database',
		userName: 'user',
		password: 'password',
		authenticationType: '',
		savePassword: true,
		groupName: 'g2/g2-2',
		groupId: 'group id',
		getUniqueId: undefined,
		providerName: 'MSSQL'
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

	test('set properties should set the values correctly', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, undefined);
		assert.equal(conn.serverName, undefined);
		conn.serverName = connectionProfile.serverName;
		conn.databaseName = connectionProfile.databaseName;
		conn.authenticationType = connectionProfile.authenticationType;
		conn.password = connectionProfile.password;
		conn.userName = connectionProfile.userName;
		conn.groupId = connectionProfile.groupId;
		conn.groupName = connectionProfile.groupName;
		conn.savePassword = connectionProfile.savePassword;
		assert.equal(conn.serverName, connectionProfile.serverName);
		assert.equal(conn.databaseName, connectionProfile.databaseName);
		assert.equal(conn.authenticationType, connectionProfile.authenticationType);
		assert.equal(conn.password, connectionProfile.password);
		assert.equal(conn.userName, connectionProfile.userName);
		assert.equal(conn.groupId, connectionProfile.groupId);
		assert.equal(conn.groupName, connectionProfile.groupName);
		assert.equal(conn.savePassword, connectionProfile.savePassword);
	});

	test('constructor should initialize the options given a valid model', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, connectionProfile);

		assert.equal(conn.serverName, connectionProfile.serverName);
		assert.equal(conn.databaseName, connectionProfile.databaseName);
		assert.equal(conn.authenticationType, connectionProfile.authenticationType);
		assert.equal(conn.password, connectionProfile.password);
		assert.equal(conn.userName, connectionProfile.userName);
		assert.equal(conn.groupId, connectionProfile.groupId);
		assert.equal(conn.groupName, connectionProfile.groupName);
		assert.equal(conn.savePassword, connectionProfile.savePassword);
	});

	test('getUniqueId should create a valid unique id', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, connectionProfile);
		let expectedId = 'MSSQL__database_new server_user_group id';
		let id = conn.getUniqueId();
		assert.equal(id, expectedId);
	});

	test('withoutPassword should create a new instance without password', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, connectionProfile);
		assert.notEqual(conn.password, '');
		let withoutPassword = conn.withoutPassword();
		assert.equal(withoutPassword.password, '');
	});

	test('unique id should not include password', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, connectionProfile);
		let withoutPassword = conn.withoutPassword();
		assert.equal(withoutPassword.getUniqueId(), conn.getUniqueId());
	});
});