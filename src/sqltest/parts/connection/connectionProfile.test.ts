/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';


import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IConnectionProfile, IConnectionProfileStore } from 'sql/parts/connection/common/interfaces';
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
		groupFullName: 'g2/g2-2',
		groupId: 'group id',
		getOptionsKey: undefined,
		providerName: 'MSSQL',
		options: {},
		saveProfile: true,
		id: undefined
	};

	let storedProfile: IConnectionProfileStore = {
		groupId: 'groupId',
		id: 'id',
		options: {
			serverName: 'new server',
			databaseName: 'database',
			userName: 'user',
			password: 'password',
			authenticationType: ''
		},
		providerName: 'MSSQL',
		savePassword: true
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
			connectionProvider: connectionProvider,
			adminServicesProvider: undefined
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
		conn.groupFullName = connectionProfile.groupFullName;
		conn.savePassword = connectionProfile.savePassword;
		assert.equal(conn.serverName, connectionProfile.serverName);
		assert.equal(conn.databaseName, connectionProfile.databaseName);
		assert.equal(conn.authenticationType, connectionProfile.authenticationType);
		assert.equal(conn.password, connectionProfile.password);
		assert.equal(conn.userName, connectionProfile.userName);
		assert.equal(conn.groupId, connectionProfile.groupId);
		assert.equal(conn.groupFullName, connectionProfile.groupFullName);
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
		assert.equal(conn.groupFullName, connectionProfile.groupFullName);
		assert.equal(conn.savePassword, connectionProfile.savePassword);
	});

	test('getOptionsKey should create a valid unique id', () => {
		let conn = new ConnectionProfile(msSQLCapabilities, connectionProfile);
		let expectedId = 'providerName:MSSQL|authenticationType:|databaseName:database|serverName:new server|userName:user|group:group id';
		let id = conn.getOptionsKey();
		assert.equal(id, expectedId);
	});

	test('createFromStoredProfile should create connection profile from stored profile', () => {
		let savedProfile = storedProfile;
		let connectionProfile = ConnectionProfile.createFromStoredProfile(savedProfile, msSQLCapabilities);
		assert.equal(savedProfile.groupId, connectionProfile.groupId);
		assert.deepEqual(savedProfile.options, connectionProfile.options);
		assert.deepEqual(savedProfile.providerName, connectionProfile.providerName);
		assert.deepEqual(savedProfile.savePassword, connectionProfile.savePassword);
		assert.deepEqual(savedProfile.id, connectionProfile.id);
	});

	test('createFromStoredProfile should set the id to new guid if not set in stored profile', () => {
		let savedProfile = Object.assign({}, storedProfile, { id: undefined });
		let connectionProfile = ConnectionProfile.createFromStoredProfile(savedProfile, msSQLCapabilities);
		assert.equal(savedProfile.groupId, connectionProfile.groupId);
		assert.deepEqual(savedProfile.options, connectionProfile.options);
		assert.deepEqual(savedProfile.providerName, connectionProfile.providerName);
		assert.equal(savedProfile.savePassword, connectionProfile.savePassword);
		assert.notEqual(connectionProfile.id, undefined);
		assert.equal(savedProfile.id, undefined);
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
		assert.equal(withoutPassword.getOptionsKey(), conn.getOptionsKey());
	});
});