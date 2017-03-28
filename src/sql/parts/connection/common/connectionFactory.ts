/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { ConnectionManagementInfo } from './connectionManagementInfo';
import { IConnectionProfile } from './interfaces';
import Utils = require('./utils');
import * as data from 'data';

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

	public hasConnection(id: string): Boolean {
		return !!this.findConnection(id);
	}

	public deleteConnection(id: string): void {
		const self = this;
		if (this.findConnection(id)) {
			delete self._connections[id];
		}
	}

	public getConnectionProfile(id: string): IConnectionProfile {
		let connectionInfoForId = this.findConnection(id);
		return connectionInfoForId ? connectionInfoForId.connectionProfile : undefined;
	}

	public addConnection(connection: IConnectionProfile, id: string): ConnectionManagementInfo {
		const self = this;
		let connectionInfo: ConnectionManagementInfo = new ConnectionManagementInfo();
		connectionInfo.extensionTimer = new Utils.Timer();
		connectionInfo.intelliSenseTimer = new Utils.Timer();
		connectionInfo.connectionProfile = connection;
		connectionInfo.connecting = true;
		self._connections[id] = connectionInfo;
		connectionInfo.serviceTimer = new Utils.Timer();

		return connectionInfo;
	}

	public updateConnection(connection: IConnectionProfile, id: string): ConnectionManagementInfo {
		let connectionInfo: ConnectionManagementInfo = this._connections[id];
		connectionInfo.connectionProfile = connection;
		return connectionInfo;
	}

	public onConnectionComplete(summary: data.ConnectionInfoSummary): ConnectionManagementInfo {
		let connection = this._connections[summary.ownerUri];
		connection.serviceTimer.end();
		connection.connecting = false;
		connection.connectionId = summary.connectionId;
		return connection;
	}

	public onConnectionChanged(changedConnInfo: data.ChangedConnectionInfo): IConnectionProfile {
		let connection = this._connections[changedConnInfo.connectionUri];
		if (connection && connection.connectionProfile) {
			connection.connectionProfile.serverName = changedConnInfo.connection.serverName;
			connection.connectionProfile.databaseName = changedConnInfo.connection.databaseName;
			connection.connectionProfile.userName = changedConnInfo.connection.userName;
			return connection.connectionProfile;
		}
		return undefined;
	}

	public isConnected(id: string): boolean {
		return (id in this._connections && this._connections[id].connectionId && Utils.isNotEmpty(this._connections[id].connectionId));
	}

	public isConnecting(id: string): boolean {
		return (id in this._connections && this._connections[id].connecting);
	}

	public getConnectionManagementId(connection: IConnectionProfile): string {

		let id = connection.getUniqueId();
		let uri = 'connection://' + (id ? id : connection.serverName + ':' + connection.databaseName);

		return uri;
	}
}