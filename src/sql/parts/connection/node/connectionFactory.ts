/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { ConnectionManagementInfo } from './connectionManagementInfo';
import { IConnectionProfile } from './interfaces';
import Utils = require('./utils');

export class ConnectionFactory {
	private _connections: { [id: string]: ConnectionManagementInfo };

	constructor() {
		this._connections = {};
	}

	public findConnection(id: string): ConnectionManagementInfo {
		if (id in this._connections) {
			return this._connections[id];
		} else {
			return undefined;
		}
	}

	public hasConnection(connectionInfo: IConnectionProfile, id: string): Boolean {
		return !!this.findConnection(id);
	}

	public deleteConnection(id: string): void {
		const self = this;
		if (this.findConnection(id)) {
			delete self._connections[id];
		}
	}

	public getConnectionProfile(connectionInfo: IConnectionProfile, id: string): IConnectionProfile {
		let connectionInfoForId = this.findConnection(id);
		return connectionInfo ? connectionInfoForId.connectionProfile : undefined;
	}

	public addConnection(connection: IConnectionProfile, id: string): ConnectionManagementInfo {
		const self = this;
		if (!this.hasConnection(connection, id)) {

			let connectionInfo: ConnectionManagementInfo = new ConnectionManagementInfo();
			connectionInfo.extensionTimer = new Utils.Timer();
			connectionInfo.intelliSenseTimer = new Utils.Timer();
			connectionInfo.connectionProfile = connection;
			connectionInfo.connecting = true;
			self._connections[id] = connectionInfo;
			connectionInfo.serviceTimer = new Utils.Timer();

			return connectionInfo;
		} else {
			return undefined;
		}
	}

	public onConnectionComplete(id: string, connectionId: string): ConnectionManagementInfo {
		let connection = this._connections[id];
		connection.serviceTimer.end();
		connection.connecting = false;
		connection.connectionId = connectionId;
		return connection;
	}

	public isConnected(id: string): boolean {
		return (id in this._connections && this._connections[id].connectionId && Utils.isNotEmpty(this._connections[id].connectionId));
	}

	public isConnecting(id: string): boolean {
		return (id in this._connections && this._connections[id].connecting);
	}

	public getUniqueUri(connection: IConnectionProfile): string {

		let id = connection.getUniqueId();
		let uri = 'connection://' + (id ? id : connection.serverName + ':' + connection.databaseName);

		return uri;
	}
}