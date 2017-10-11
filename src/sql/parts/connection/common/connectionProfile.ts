/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import * as data from 'data';
import { ProviderConnectionInfo } from 'sql/parts/connection/common/providerConnectionInfo';
import * as interfaces from 'sql/parts/connection/common/interfaces';

import { generateUuid } from 'vs/base/common/uuid';

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

	public isDisconnecting: boolean = false;
	public constructor(serverCapabilities?: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		super(serverCapabilities, model);
		if (model) {
			this.groupId = model.groupId;
			this.groupFullName = model.groupFullName;
			this.savePassword = model.savePassword;
			this.saveProfile = model.saveProfile;
			this._id = model.id;
		} else {
			//Default for a new connection
			this.savePassword = false;
			this.saveProfile = true;
			this._groupName = ConnectionProfile.RootGroupName;
			this._id = generateUuid();
		}
	}

	public generateNewId() {
		this._id = generateUuid();
	}

	public getParent(): ConnectionProfileGroup {
		return this.parent;
	}

	public get id(): string {
		if (!this._id) {
			this._id = generateUuid();
		}
		return this._id;
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

	public cloneWithNewId(): ConnectionProfile {
		let instance = this.clone();
		instance.generateNewId();
		return instance;
	}

	public cloneWithDatabase(databaseName: string): ConnectionProfile {
		let instance = this.cloneWithNewId();
		instance.databaseName = databaseName;
		return instance;
	}

	public static readonly RootGroupName: string = '/';

	public withoutPassword(): ConnectionProfile {
		let clone = this.clone();
		clone.password = '';
		return clone;
	}

	/**
	 * Returns a key derived the connections options (providerName, authenticationType, serverName, databaseName, userName, groupid)
	 * This key uniquely identifies a connection in a group
	 * Example: "providerName:MSSQL|authenticationType:|databaseName:database|serverName:server3|userName:user|group:testid"
	 */
	public getOptionsKey(): string {
		let id = super.getOptionsKey();
		return id + ProviderConnectionInfo.idSeparator + 'group' + ProviderConnectionInfo.nameValueSeparator + this.groupId;
	}

	/**
	 * Returns the unique id for the connection that doesn't include the group name
	 */
	public getConnectionInfoId(): string {
		return super.getOptionsKey();
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
			getOptionsKey: undefined,
			groupId: this.groupId,
			groupFullName: this.groupFullName,
			password: this.password,
			providerName: this.providerName,
			savePassword: this.savePassword,
			userName: this.userName,
			options: this.options,
			saveProfile: this.saveProfile,
			id: this.id
		};

		return result;
	}

	public toConnectionInfo(): data.ConnectionInfo {
		return {
			options: this.options
		};
	}

	public static createFromStoredProfile(profile: interfaces.IConnectionProfileStore, serverCapabilities: data.DataProtocolServerCapabilities): ConnectionProfile {
		let connectionInfo = new ConnectionProfile(serverCapabilities, undefined);
		connectionInfo.options = profile.options;
		connectionInfo.groupId = profile.groupId;
		connectionInfo.providerName = profile.providerName;
		connectionInfo.saveProfile = true;
		connectionInfo.savePassword = profile.savePassword;
		connectionInfo.id = profile.id || generateUuid();
		return connectionInfo;
	}

	public static convertToConnectionProfile(serverCapabilities: data.DataProtocolServerCapabilities, conn: IConnectionProfile): ConnectionProfile {
		if (conn) {
			let connectionProfile: ConnectionProfile = undefined;
			let connectionProfileInstance = conn as ConnectionProfile;
			if (connectionProfileInstance && conn instanceof ConnectionProfile) {
				connectionProfile = connectionProfileInstance;
				connectionProfile.setServerCapabilities(serverCapabilities);
			} else {
				connectionProfile = new ConnectionProfile(serverCapabilities, conn);
			}

			return connectionProfile;
		} else {
			return undefined;
		}
	}

	public static convertToProfileStore(
		serverCapabilities: data.DataProtocolServerCapabilities,
		connectionProfile: IConnectionProfile): interfaces.IConnectionProfileStore {
		if (connectionProfile) {
			let connectionInfo = ConnectionProfile.convertToConnectionProfile(serverCapabilities, connectionProfile);
			let profile: interfaces.IConnectionProfileStore = {
				options: {},
				groupId: connectionProfile.groupId,
				providerName: connectionInfo.providerName,
				savePassword: connectionInfo.savePassword,
				id: connectionInfo.id
			};

			profile.options = connectionInfo.options;

			return profile;
		} else {
			return undefined;
		}
	}

}
