/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import * as utils from './utils';
import data = require('data');
import { ProviderConnectionInfo } from 'sql/parts/connection/node/providerConnectionInfo';
import * as interfaces from 'sql/parts/connection/node/interfaces';

// Concrete implementation of the IConnectionProfile interface

/**
 * A concrete implementation of an IConnectionProfile with support for profile creation and validation
 */
export class ConnectionProfile extends ProviderConnectionInfo implements interfaces.IConnectionProfile {

	public parent: ConnectionProfileGroup = null;
	private _id: string;
	public savePassword: boolean;
	public groupName: string;
	public groupId: string;

	public constructor(serverCapabilities?: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		super(serverCapabilities, model);
		if (model) {
			this.groupId = model.groupId;
			this.groupName = model.groupName;
			this.savePassword = model.savePassword;
		}
	}

	public equals(other: any): boolean {
		if (!(other instanceof ConnectionProfile)) {
			return false;
		}
		return other.getUniqueId() === this.getUniqueId() && other.serverName === this.serverName;
	}

	public getParent(): ConnectionProfileGroup {
		return this.parent;
	}

	public get id(): string {
		return this._id ? this._id : this.getUniqueId();
	}

	public set id(value: string) {
		this._id = value;
	}

	public clone(): ConnectionProfile {
		let instance = new ConnectionProfile(this._serverCapabilities, this);
		return instance;
	}

	public withoutPassword(): ConnectionProfile {
		let clone = this.clone();
		clone.password = '';
		return clone;
	}

	public getUniqueId(): string {
		let id = super.getUniqueId();
		return id + this.groupId;
	}

	/**
	 * Returns the unique id for the connection that doesn't include group name
	 */
	public getConnectionInfoId(): string {
		return super.getUniqueId();
	}

	public onProviderRegistered(serverCapabilities: data.DataProtocolServerCapabilities): void {
		if (serverCapabilities.providerName === this.providerName) {
			this.setServerCapabilities(serverCapabilities);
		}
	}

	public toIConnectionProfile(): IConnectionProfile {
		let result: IConnectionProfile = {
			serverName: this.serverName,
			databaseName: this.databaseName,
			authenticationType: this.authenticationType,
			getUniqueId: undefined,
			groupId: this.groupId,
			groupName: this.groupName,
			password: this.password,
			providerName: this.providerName,
			savePassword: this.savePassword,
			userName: this.userName,
			options: this.options
		};

		return result;
	}

	public static createFromStoredProfile(profile: interfaces.IConnectionProfileStore, serverCapabilities: data.DataProtocolServerCapabilities): ConnectionProfile {
		let connectionInfo = new ConnectionProfile(serverCapabilities, undefined);
		connectionInfo.options = profile.options;
		connectionInfo.groupId = profile.groupId;
		connectionInfo.providerName = profile.providerName;
		return connectionInfo;
	}

	public static convertToProfileStore(
		serverCapabilities: data.DataProtocolServerCapabilities,
		connectionProfile: IConnectionProfile): interfaces.IConnectionProfileStore {

		let connectionInfo = connectionProfile as ConnectionProfile;
		if (!connectionInfo) {
			connectionInfo = new ConnectionProfile(serverCapabilities, connectionProfile);
		}
		let profile: interfaces.IConnectionProfileStore = {
			options: {},
			groupId: connectionProfile.groupId,
			providerName: connectionInfo.providerName
		};

		profile.options = connectionInfo.options;

		return profile;
	}

}
