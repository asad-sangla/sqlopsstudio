/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import data = require('data');
import { ProviderConnectionInfo } from 'sql/parts/connection/common/providerConnectionInfo';
import * as interfaces from 'sql/parts/connection/common/interfaces';

// Concrete implementation of the IConnectionProfile interface

/**
 * A concrete implementation of an IConnectionProfile with support for profile creation and validation
 */
export class ConnectionProfile extends ProviderConnectionInfo implements interfaces.IConnectionProfile {

	public parent: ConnectionProfileGroup = null;
	private _id: string;
	public savePassword: boolean;
	private _groupName: string;
	public groupId: string;
	public saveProfile: boolean;

	public constructor(serverCapabilities?: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		super(serverCapabilities, model);
		if (model) {
			this.groupId = model.groupId;
			this.groupFullName = model.groupFullName;
			this.savePassword = model.savePassword;
			this.saveProfile = model.saveProfile;
		} else {
			//Default for a new connection
			this.savePassword = false;
			this.saveProfile = true;
			this._groupName = ConnectionProfile.RootGroupName;
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

	public get groupFullName(): string {
		return this._groupName;
	}

	public set groupFullName(value: string) {
		this._groupName = value;
	}

	public get isAddedToRootGroup(): boolean {
		return (this._groupName === ConnectionProfile.RootGroupName);
	}

	public clone(): ConnectionProfile {
		let instance = new ConnectionProfile(this._serverCapabilities, this);
		return instance;
	}

	public static RootGroupName: string = '/';

	public withoutPassword(): ConnectionProfile {
		let clone = this.clone();
		clone.password = '';
		return clone;
	}

	public getUniqueId(): string {
		let id = super.getUniqueId();
		return id + ProviderConnectionInfo.idSeparator + 'group:' + this.groupId;
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
			groupFullName: this.groupFullName,
			password: this.password,
			providerName: this.providerName,
			savePassword: this.savePassword,
			userName: this.userName,
			options: this.options,
			saveProfile: this.saveProfile
		};

		return result;
	}

	public static createFromStoredProfile(profile: interfaces.IConnectionProfileStore, serverCapabilities: data.DataProtocolServerCapabilities): ConnectionProfile {
		let connectionInfo = new ConnectionProfile(serverCapabilities, undefined);
		connectionInfo.options = profile.options;
		connectionInfo.groupId = profile.groupId;
		connectionInfo.providerName = profile.providerName;
		connectionInfo.saveProfile = true;
		connectionInfo.savePassword = profile.savePassword;
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
			providerName: connectionInfo.providerName,
			savePassword: connectionInfo.savePassword
		};

		profile.options = connectionInfo.options;

		return profile;
	}

}
