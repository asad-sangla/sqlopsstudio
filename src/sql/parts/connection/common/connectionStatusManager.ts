/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { ConnectionManagementInfo } from './connectionManagementInfo';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IConnectionProfile } from './interfaces';
import Utils = require('./utils');
import * as data from 'data';

export class ConnectionStatusManager {

	private _connections: { [id: string]: ConnectionManagementInfo };
	public static readonly DefaultUriPrefix: string = 'connection://';
	public static readonly DashboardUriPrefix: string = 'dashboard://';
	private _providerCapabilitiesMap: { [providerName: string]: data.DataProtocolServerCapabilities };

	constructor( @ICapabilitiesService private _capabilitiesService: ICapabilitiesService) {
		this._connections = {};
		this._providerCapabilitiesMap = {};
	}

	public getCapabilities(providerName: string): data.DataProtocolServerCapabilities {
		let result: data.DataProtocolServerCapabilities;

		if (providerName in this._providerCapabilitiesMap) {
			result = this._providerCapabilitiesMap[providerName];
		} else {
			let capabilities = this._capabilitiesService.getCapabilities();
			if (capabilities) {
				let providerCapabilities = capabilities.find(c => c.providerName === providerName);
				if (providerCapabilities) {
					this._providerCapabilitiesMap[providerName] = providerCapabilities;
					result = providerCapabilities;
				}
			}
		}

		return result;
	}

	public findConnection(id: string): ConnectionManagementInfo {
		if (id in this._connections) {
			return this._connections[id];
		} else {
			return undefined;
		}
	}

	public findConnectionProfile(connectionProfile: IConnectionProfile): ConnectionManagementInfo {
		let id = this.getConnectionManagementId(connectionProfile);
		return this.findConnection(id);
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

	public getConnectionProfile(id: string): ConnectionProfile {
		let connectionInfoForId = this.findConnection(id);
		return connectionInfoForId ? connectionInfoForId.connectionProfile : undefined;
	}

	public addConnection(connection: IConnectionProfile, id: string): ConnectionManagementInfo {
		// Always create a copy and save that in the list
		let connectionProfile = new ConnectionProfile(this.getCapabilities(connection.providerName), connection);
		const self = this;
		let connectionInfo: ConnectionManagementInfo = new ConnectionManagementInfo();
		connectionInfo.providerId = connection.providerName;
		connectionInfo.extensionTimer = new Utils.Timer();
		connectionInfo.intelliSenseTimer = new Utils.Timer();
		connectionInfo.connectionProfile = connectionProfile;
		connectionInfo.connecting = true;
		self._connections[id] = connectionInfo;
		connectionInfo.serviceTimer = new Utils.Timer();

		return connectionInfo;
	}

	/**
	 * Call after a connection is saved to settings. It's only for default url connections
	 * which their id is generated from connection options. The group id is used in the generated id.
	 * when the connection is stored, the group id get assigned to the profile and it can change the id
	 * So for those kind of connections, we need to add the new id and the connection
	 */
	public updateConnectionProfile(connection: IConnectionProfile, id: string): string {
		let connectionInfo: ConnectionManagementInfo = this._connections[id];
		let newId: string = id;
		if (connectionInfo && this.isDefaultTypeUri(id)) {
			connectionInfo.connectionProfile.groupId = connection.groupId;
			newId = this.getConnectionManagementId(connection);
			if (newId !== id) {
				this._connections[newId] = connectionInfo;
				this.deleteConnection(id);
			}
		}
		if (connection && connectionInfo) {
			connectionInfo.connectionProfile.id = connection.id;
		}
		return newId;
	}

	public onConnectionComplete(summary: data.ConnectionInfoSummary): ConnectionManagementInfo {
		let connection = this._connections[summary.ownerUri];
		connection.serviceTimer.end();
		connection.connecting = false;
		connection.connectionId = summary.connectionId;
		connection.serverInfo = summary.serverInfo;
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

		let id = connection.getOptionsKey();
		let uri = ConnectionStatusManager.DefaultUriPrefix + (id ? id : connection.serverName + ':' + connection.databaseName);

		return uri;
	}
	public isDefaultTypeUri(uri: string): boolean {
		return uri && uri.startsWith(ConnectionStatusManager.DefaultUriPrefix);
	}

	public getProviderIdFromUri(ownerUri: string) {
		let providerId: string = '';
		let connection = this.findConnection(ownerUri);
		if (connection) {
			providerId = connection.connectionProfile.providerName;
		}
		if (Utils.isEmpty(providerId) && this.isDefaultTypeUri(ownerUri)) {
			let optionsKey = ownerUri.replace(ConnectionStatusManager.DefaultUriPrefix, '');
			providerId = ConnectionProfile.getProviderFromOptionsKey(optionsKey);
		}
		return providerId;
	}
}