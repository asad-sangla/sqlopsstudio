/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import data = require('data');
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

let connections: ConnectionFactory;
let connectionProfile: IConnectionProfile = {
	serverName: 'new server',
	databaseName: 'database',
	userName: 'user',
	password: 'password',
	authenticationType: '',
	savePassword: true,
	groupFullName: 'g2/g2-2',
	groupId: 'group id',
	getUniqueId: () => 'connection1',
	providerName: 'MSSQL',
	options: {},
	saveProfile: true
};
let editorConnectionProfile: IConnectionProfile = {
	serverName: 'new server',
	databaseName: 'database',
	userName: 'user',
	password: 'password',
	authenticationType: '',
	savePassword: true,
	groupFullName: 'g2/g2-2',
	groupId: 'group id',
	getUniqueId: () => 'connection2',
	providerName: 'MSSQL',
	options: {},
	saveProfile: true
};

let connection1Id: string;
let connection2Id: string;

suite('SQL ConnectionFactory tests', () => {
	setup(() => {
		connections = new ConnectionFactory();
		connection1Id = connections.getConnectionManagementId(connectionProfile);
		connection2Id = 'connection2Id';
		connections.addConnection(connectionProfile, connection1Id);
		connections.addConnection(editorConnectionProfile, connection2Id);
	});

	test('findConnection should return undefined given invalid id', () => {
		let id: string = 'invalid id';
		let expected = undefined;
		let actual = connections.findConnection(id);
		assert.equal(actual, expected);
	});

	test('findConnection should return connection given valid id', () => {
		let id: string = connection1Id;
		let expected = connectionProfile;
		let actual = connections.findConnection(id);
		assert.equal(actual.connectionProfile, expected);
	});

	test('getConnectionProfile should return undefined given invalid id', () => {
		let id: string = 'invalid id';
		let expected = undefined;
		let actual = connections.getConnectionProfile(id);
		assert.equal(actual, expected);
	});

	test('getConnectionProfile should return connection given valid id', () => {
		let id: string = connection1Id;
		let expected = connectionProfile;
		let actual = connections.getConnectionProfile(id);
		assert.equal(actual, expected);
	});

	test('hasConnection should return false given invalid id', () => {
		let id: string = 'invalid id';
		let expected = false;
		let actual = connections.hasConnection(id);
		assert.equal(actual, expected);
	});

	test('hasConnection should return true given valid id', () => {
		let id: string = connection1Id;
		let expected = true;
		let actual = connections.hasConnection(id);
		assert.equal(actual, expected);
	});

	test('addConnection should set connecting to true', () => {
		let expected = true;
		let summary: data.ConnectionInfoSummary = {
			ownerUri: connection1Id,
			connectionId: connection1Id,
			messages: undefined,
			errorMessage: undefined,
			errorNumber: undefined,
			serverInfo: undefined,
			connectionSummary: undefined
		};
		connections.onConnectionComplete(summary);
		let actual = connections.addConnection(connectionProfile, connection1Id).connecting;
		assert.equal(actual, expected);
	});

	test('onConnectionComplete should set connecting to false', () => {
		let expected = false;
		let summary: data.ConnectionInfoSummary = {
			ownerUri: connection1Id,
			connectionId: connection1Id,
			messages: undefined,
			errorMessage: undefined,
			errorNumber: undefined,
			serverInfo: undefined,
			connectionSummary: undefined
		};
		connections.onConnectionComplete(summary);
		let actual = connections.findConnection(connection1Id).connecting;
		assert.equal(actual, expected);
		actual = connections.isConnecting(connection1Id);
		assert.equal(actual, expected);
	});

	test('updateConnection should update the connection info', () => {
		let expected = connectionProfile.groupId + '1';

		let updatedConnection = Object.assign({}, connectionProfile, { groupId: expected, getUniqueId: () => connectionProfile.getUniqueId() + expected });
		connections.updateConnection(updatedConnection, connection1Id);

		let newId = connections.getConnectionManagementId(updatedConnection);
		let actual = connections.getConnectionProfile(newId).groupId;
		assert.equal(actual, expected);
	});
});