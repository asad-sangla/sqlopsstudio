/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Constants = require('./constants');
import ConnInfo = require('./connectionInfo');
import Utils = require('./utils');
import { ConnectionProfile } from '../common/connectionProfile';
import { IConnectionProfile, CredentialsQuickPickItemType } from 'sql/parts/connection/common/interfaces';
import { ICredentialsService } from 'sql/services/credentials/credentialsService';
import { IConnectionConfig } from './iconnectionConfig';
import { ConnectionConfig } from './connectionConfig';
import { Memento, Scope as MementoScope } from 'vs/workbench/common/memento';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import data = require('data');

/**
 * Manages the connections list including saved profiles and the most recently used connections
 *
 * @export
 * @class ConnectionStore
 */
export class ConnectionStore {

	private _memento: any;
	private _groupIdToFullNameMap: { [groupId: string]: string };
	private _groupFullNameToIdMap: { [groupId: string]: string };

	constructor(
		private _storageService: IStorageService,
		private _context: Memento,
		private _configurationEditService: IConfigurationEditingService,
		private _workspaceConfigurationService: IWorkspaceConfigurationService,
		private _credentialService: ICredentialsService,
		private _capabilitiesService: ICapabilitiesService,
		private _connectionConfig?: IConnectionConfig
	) {

		if (_context) {
			this._memento = this._context.getMemento(this._storageService, MementoScope.GLOBAL);
		}
		this._groupIdToFullNameMap = {};
		this._groupFullNameToIdMap = {};

		if (!this._connectionConfig) {
			let cachedServerCapabilities = this.getCachedServerCapabilities();
			this._connectionConfig = new ConnectionConfig(this._configurationEditService,
				this._workspaceConfigurationService, this._capabilitiesService, cachedServerCapabilities);
			this._connectionConfig.setCachedMetadata(cachedServerCapabilities);
		}
	}

	public static get CRED_PREFIX(): string { return 'Microsoft.SqlTools'; }
	public static get CRED_SEPARATOR(): string { return '|'; }
	public static get CRED_ID_PREFIX(): string { return 'id:'; }
	public static get CRED_ITEMTYPE_PREFIX(): string { return 'itemtype:'; }
	public static get CRED_PROFILE_USER(): string { return CredentialsQuickPickItemType[CredentialsQuickPickItemType.Profile]; };
	public static get CRED_MRU_USER(): string { return CredentialsQuickPickItemType[CredentialsQuickPickItemType.Mru]; };

	public formatCredentialIdForCred(connectionProfile: IConnectionProfile, itemType?: CredentialsQuickPickItemType): string {
		if (Utils.isEmpty(connectionProfile)) {
			throw new Error('Missing Connection which is required');
		}
		let itemTypeString: string = ConnectionStore.CRED_PROFILE_USER;
		if (itemType) {
			itemTypeString = CredentialsQuickPickItemType[itemType];
		}
		return this.formatCredentialId(connectionProfile, itemTypeString);
	}

	/**
	 * Creates a formatted credential usable for uniquely identifying a SQL Connection.
	 * This string can be decoded but is not optimized for this.
	 * @static
	 * @param {IConnectionProfile} connectionProfile connection profile - require
	 * @param {string} itemType type of the item (MRU or Profile) - optional
	 * @returns {string} formatted string with server, DB and username
	 */
	public formatCredentialId(connectionProfile: IConnectionProfile, itemType?: string): string {
		let connectionProfileInstance: ConnectionProfile = ConnectionProfile.convertToConnectionProfile(
			this._connectionConfig.getCapabilities(connectionProfile.providerName), connectionProfile);
		if (Utils.isEmpty(connectionProfileInstance.getConnectionInfoId())) {
			throw new Error('Missing Id, which is required');
		}
		let cred: string[] = [ConnectionStore.CRED_PREFIX];
		if (!itemType) {
			itemType = ConnectionStore.CRED_PROFILE_USER;
		}

		ConnectionStore.pushIfNonEmpty(itemType, ConnectionStore.CRED_ITEMTYPE_PREFIX, cred);
		ConnectionStore.pushIfNonEmpty(connectionProfileInstance.getConnectionInfoId(), ConnectionStore.CRED_ID_PREFIX, cred);
		return cred.join(ConnectionStore.CRED_SEPARATOR);
	}

	private static pushIfNonEmpty(value: string, prefix: string, arr: string[]): void {
		if (Utils.isNotEmpty(value)) {
			arr.push(prefix.concat(value));
		}
	}

	/**
	 * Returns true if the password is required
	 * @param connection profile
	 */
	public isPasswordRequired(connection: IConnectionProfile): boolean {
		if (connection) {
			let connectionProfile = ConnectionProfile.convertToConnectionProfile(this._connectionConfig.getCapabilities(connection.providerName), connection);
			return connectionProfile.isPasswordRequired();
		} else {
			return false;
		}
	}

	/**
	 * Gets all connection profiles stored in the user settings
	 * Profiles from workspace will be included if getWorkspaceProfiles is passed as true
	 * Note: connections will not include password value
	 *
	 * @returns {IConnectionProfile[]}
	 */
	public getProfiles(getWorkspaceProfiles: boolean): IConnectionProfile[] {
		return this.loadProfiles(getWorkspaceProfiles);
	}

	public addSavedPassword(credentialsItem: IConnectionProfile): Promise<IConnectionProfile> {
		let self = this;
		return new Promise<IConnectionProfile>((resolve, reject) => {
			if (credentialsItem.savePassword && this.isPasswordRequired(credentialsItem)
				&& Utils.isEmpty(credentialsItem.password)) {

				let credentialId = this.formatCredentialIdForCred(credentialsItem, undefined);
				self._credentialService.readCredential(credentialId)
					.then(savedCred => {
						if (savedCred) {
							credentialsItem.password = savedCred.password;
						}
						resolve(credentialsItem);
					},
					reason => {
						reject(reason);
					});
			} else {
				// Already have a password, no need to look up
				resolve(credentialsItem);
			}
		});
	}

	/**
	 * Saves a connection profile to the user settings.
	 * Password values are stored to a separate credential store if the "savePassword" option is true
	 *
	 * @param {IConnectionProfile} profile the profile to save
	 * @param {forceWritePlaintextPassword} whether the plaintext password should be written to the settings file
	 * @returns {Promise<IConnectionProfile>} a Promise that returns the original profile, for help in chaining calls
	 */
	public saveProfile(profile: IConnectionProfile, forceWritePlaintextPassword?: boolean): Promise<IConnectionProfile> {
		const self = this;
		return new Promise<IConnectionProfile>((resolve, reject) => {
			// Add the profile to the saved list, taking care to clear out the password field if necessary
			let savedProfile: IConnectionProfile;
			if (forceWritePlaintextPassword) {
				savedProfile = profile;
			} else {

				savedProfile = this.getProfileWithoutPassword(profile);
			}
			self.saveProfileToConfig(savedProfile)
				.then(savedConnectionProfile => {
					profile.groupId = savedConnectionProfile.groupId;
					// Only save if we successfully added the profile
					return self.saveProfilePasswordIfNeeded(profile);
					// And resolve / reject at the end of the process
				}, err => {
					reject(err);
				}).then(resolved => {
					// Add necessary default properties before returning
					// this is needed to support immediate connections
					ConnInfo.fixupConnectionCredentials(profile);
					this.saveCachedServerCapabilities();
					resolve(profile);
				}, err => {
					reject(err);
				});
		});
	}

	private saveProfileToConfig(profile: IConnectionProfile): Promise<IConnectionProfile> {
		const self = this;
		if (profile.saveProfile) {
			return self._connectionConfig.addConnection(profile);
		} else {
			return self.addUnSavedConnection(profile);
		}
	}

	private getCachedServerCapabilities(): data.DataProtocolServerCapabilities[] {
		if (this._memento) {
			let metadata: data.DataProtocolServerCapabilities[] = this._memento[Constants.capabilitiesOptions];
			return metadata;
		} else {
			return undefined;
		}

	}

	private saveCachedServerCapabilities(): void {
		if (this._memento) {
			let capabilities = this._capabilitiesService.getCapabilities();
			this._memento[Constants.capabilitiesOptions] = capabilities;
		}
	}

	/**
	 * Gets the list of recently used connections. These will not include the password - a separate call to
	 * {addSavedPassword} is needed to fill that before connecting
	 *
	 * @returns {data.ConnectionInfo} the array of connections, empty if none are found
	 */
	public getRecentlyUsedConnections(): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento[Constants.recentConnections];
		if (!configValues) {
			configValues = [];
		}

		configValues = configValues.filter(c => !!(c));
		return this.convertConfigValuesToConnectionProfiles(configValues);
	}

	private convertConfigValuesToConnectionProfiles(configValues: IConnectionProfile[]): ConnectionProfile[] {
		return configValues.map(c => {
			if (c) {
				let capabilities = this._connectionConfig.getCapabilities(c.providerName);
				let connectionProfile = new ConnectionProfile(capabilities, c);
				this._capabilitiesService.onProviderRegisteredEvent((serverCapabilities) => {
					connectionProfile.onProviderRegistered(serverCapabilities);
				});
				if (connectionProfile.saveProfile) {
					if (Utils.isEmpty(connectionProfile.groupFullName) && connectionProfile.groupId) {
						connectionProfile.groupFullName = this.getGroupFullName(connectionProfile.groupId);
					}
					if (Utils.isEmpty(connectionProfile.groupId) && connectionProfile.groupFullName) {
						connectionProfile.groupId = this.getGroupId(connectionProfile.groupFullName);
					} else if (Utils.isEmpty(connectionProfile.groupId) && Utils.isEmpty(connectionProfile.groupFullName)) {
						connectionProfile.groupId = this.getGroupId('');
					}
				}
				return connectionProfile;
			} else {
				return undefined;
			};
		});
	}

	/**
	 * Gets the list of active connections. These will not include the password - a separate call to
	 * {addSavedPassword} is needed to fill that before connecting
	 *
	 * @returns {data.ConnectionInfo} the array of connections, empty if none are found
	 */
	public getActiveConnections(): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento[Constants.activeConnections];
		if (!configValues) {
			configValues = [];
		}

		return this.convertConfigValuesToConnectionProfiles(configValues);
	}

	/**
	 * Gets the list of unsaved connections. These will not include the password - a separate call to
	 * {addSavedPassword} is needed to fill that before connecting
	 *
	 * @returns {data.ConnectionInfo} the array of connections, empty if none are found
	 */
	public getUnSavedConnections(): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento[Constants.unsavedConnections];
		if (!configValues) {
			configValues = [];
		}

		return this.convertConfigValuesToConnectionProfiles(configValues);
	}

	public getProfileWithoutPassword(conn: IConnectionProfile): ConnectionProfile {
		if (conn) {
			let savedConn: ConnectionProfile = ConnectionProfile.convertToConnectionProfile(this._connectionConfig.getCapabilities(conn.providerName), conn);
			savedConn = savedConn.withoutPassword();

			return savedConn;
		} else {
			return undefined;
		}
	}

	/**
	 * Adds a connection to the active connections list.
	 * Password values are stored to a separate credential store if the "savePassword" option is true
	 *
	 * @param {IConnectionCredentials} conn the connection to add
	 * @returns {Promise<void>} a Promise that returns when the connection was saved
	 */
	public addActiveConnection(conn: IConnectionProfile): Promise<void> {
		return this.addConnectionToMemento(conn, Constants.activeConnections, undefined, true).then(() => {
			let maxConnections = this.getMaxRecentConnectionsCount();
			return this.addConnectionToMemento(conn, Constants.recentConnections, maxConnections);
		});
	}

	public addConnectionToMemento(conn: IConnectionProfile, mementoKey: string, maxConnections?: number, savePassword?: boolean): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			// Get all profiles
			let configValues = self.getConnectionsFromMemento(mementoKey);
			let configToSave = this.addToConnectionList(conn, configValues);
			if (maxConnections) {
				// Remove last element if needed
				if (configToSave.length > maxConnections) {
					configToSave = configToSave.slice(0, maxConnections);
				}
			}
			self._memento[mementoKey] = configToSave;
			if (savePassword) {
				self.doSavePassword(conn, CredentialsQuickPickItemType.Mru);
			}
			resolve(undefined);
		});
	}

	public getConnectionsFromMemento(mementoKey: string): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento[mementoKey];
		if (!configValues) {
			configValues = [];
		}

		return this.convertConfigValuesToConnectionProfiles(configValues);
	}

	/**
	 * Adds a connection to the active connections list.
	 * Password values are stored to a separate credential store if the "savePassword" option is true
	 *
	 * @param {IConnectionCredentials} conn the connection to add
	 * @returns {Promise<void>} a Promise that returns when the connection was saved
	 */
	public addUnSavedConnection(conn: IConnectionProfile): Promise<IConnectionProfile> {

		const self = this;
		return new Promise<IConnectionProfile>((resolve, reject) => {
			// Get all profiles
			let configValues = self.getUnSavedConnections();
			let configToSave = this.addToConnectionList(conn, configValues);
			self._memento[Constants.unsavedConnections] = configToSave;
			resolve(conn);
		});
	}

	private addToConnectionList(conn: IConnectionProfile, list: ConnectionProfile[]): IConnectionProfile[] {
		let savedProfile: ConnectionProfile = this.getProfileWithoutPassword(conn);

		// Remove the connection from the list if it already exists
		list = list.filter(value => {
			let equal = value && value.getConnectionInfoId() === savedProfile.getConnectionInfoId();
			if (equal && savedProfile.saveProfile) {
				equal = value.groupId === savedProfile.groupId ||
					ConnectionProfileGroup.sameGroupName(value.groupFullName, savedProfile.groupFullName);
			}
			return !equal;
		});

		list.unshift(savedProfile);

		let newList = list.map(c => {
			let connectionProfile = c.toIConnectionProfile();
			return connectionProfile;
		});
		return newList;
	}

	/**
	 * Clear all recently used connections from the MRU list.
	 */
	public clearRecentlyUsed(): void {
		this._memento[Constants.recentConnections] = [];
	}

	public clearFromMemento(name: string): void {
		this._memento[name] = [];
	}


	/**
	 * Clear all active connections from the MRU list.
	 */
	public clearActiveConnections(): void {
		this._memento[Constants.activeConnections] = [];
	}

	/**
	 * Clear all unsaved connections
	 */
	public clearUnsavedConnections(): void {
		this._memento[Constants.unsavedConnections] = [];
	}

	/**
	 * Remove a connection profile from the recently used list.
	 */
	private removeRecentlyUsed(conn: IConnectionProfile): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			// Get all profiles
			let configValues = self.getRecentlyUsedConnections();

			// Remove the connection from the list if it already exists
			configValues = configValues.filter(value => !Utils.isSameProfile(value, conn));

			// Update the MRU list
			self._memento[Constants.recentConnections] = configValues;
		});
	}

	/**
	 * Remove a connection profile from the active connections list.
	 */
	private removeActiveConnection(conn: IConnectionProfile): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			// Get all profiles
			let configValues = self.getActiveConnections();

			// Remove the connection from the list if it already exists
			configValues = configValues.filter(value => !Utils.isSameProfile(value, conn));

			// Update the Active list
			self._memento[Constants.activeConnections] = configValues;
		});
	}

	/**
	 * Remove a connection profile from the unsave connections list.
	 */
	private removeUnsavedConnection(id: string): void {
		// Get all profiles
		let configValues: ConnectionProfile[] = this.getUnSavedConnections();
		// Remove the connection from the list if it already exists
		configValues = configValues.filter(value => value.getOptionsKey() !== id);
		let newList = configValues.map(c => {
			let connectionProfile = c.toIConnectionProfile();
			return connectionProfile;
		});

		this._memento[Constants.unsavedConnections] = newList;
	}

	private saveProfilePasswordIfNeeded(profile: IConnectionProfile): Promise<boolean> {
		if (!profile.savePassword) {
			return Promise.resolve(true);
		}
		return this.doSavePassword(profile, CredentialsQuickPickItemType.Profile);
	}

	private doSavePassword(conn: IConnectionProfile, type: CredentialsQuickPickItemType): Promise<boolean> {
		let self = this;
		return new Promise<boolean>((resolve, reject) => {
			if (Utils.isNotEmpty(conn.password)) {
				let credType: string = type === CredentialsQuickPickItemType.Mru ? ConnectionStore.CRED_MRU_USER : ConnectionStore.CRED_PROFILE_USER;
				let credentialId = this.formatCredentialId(conn, credType);
				self._credentialService.saveCredential(credentialId, conn.password)
					.then((result) => {
						resolve(result);
					}, reason => {
						// Bubble up error if there was a problem executing the set command
						reject(reason);
					});
			} else {
				resolve(true);
			}
		});
	}

	public getConnectionProfileGroups(withoutConnections?: boolean): ConnectionProfileGroup[] {
		let profilesInConfiguration: ConnectionProfile[];
		if (!withoutConnections) {
			profilesInConfiguration = this._connectionConfig.getConnections(true);
		}
		let groups = this._connectionConfig.getAllGroups();

		let connectionProfileGroups = this.convertToConnectionGroup(groups, profilesInConfiguration, undefined);
		return connectionProfileGroups;
	}

	private convertToConnectionGroup(groups: IConnectionProfileGroup[], connections: ConnectionProfile[], parent: ConnectionProfileGroup = undefined): ConnectionProfileGroup[] {
		let result: ConnectionProfileGroup[] = [];
		let children = groups.filter(g => g.parentId === (parent ? parent.id : undefined));
		if (children) {
			children.map(group => {
				let connectionGroup = new ConnectionProfileGroup(group.name, parent, group.id);
				this.addGroupFullNameToMap(group.id, connectionGroup.fullName);
				if (connections) {
					let connectionsForGroup = connections.filter(conn => conn.groupId === connectionGroup.id);
					var conns = [];
					connectionsForGroup.forEach((conn) => {
						conn.groupFullName = connectionGroup.fullName;
						conns.push(conn);
					});
					connectionGroup.addConnections(conns);
				}

				let childrenGroups = this.convertToConnectionGroup(groups, connections, connectionGroup);
				connectionGroup.addGroups(childrenGroups);
				result.push(connectionGroup);
			});
			if (parent) {
				parent.addGroups(result);
			}
		}
		return result;
	}

	private loadProfiles(loadWorkspaceProfiles: boolean): IConnectionProfile[] {
		let connections: IConnectionProfile[] = this._connectionConfig.getConnections(loadWorkspaceProfiles);
		return connections;
	}

	private getMaxRecentConnectionsCount(): number {
		let config = this._workspaceConfigurationService.getConfiguration(Constants.extensionConfigSectionName);

		let maxConnections: number = config[Constants.configMaxRecentConnections];
		if (typeof (maxConnections) !== 'number' || maxConnections <= 0) {
			maxConnections = 5;
		}
		return maxConnections;
	}

	public renameGroup(group: ConnectionProfileGroup): Promise<void> {
		return this._connectionConfig.renameGroup(group);
	}

	public deleteConnectionFromConfiguration(connection: ConnectionProfile): Promise<void> {
		return this._connectionConfig.deleteConnection(connection);
	}

	public deleteGroupFromConfiguration(group: ConnectionProfileGroup): Promise<void> {
		return this._connectionConfig.deleteGroup(group);
	}

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		return this._connectionConfig.changeGroupIdForConnectionGroup(source, target);
	}

	public changeGroupIdForConnection(source: ConnectionProfile, targetGroupId: string): Promise<void> {
		let oldId = source.getOptionsKey();
		let oldParentId = source.parent.id;
		return new Promise<void>((resolve, reject) => {
			this._connectionConfig.changeGroupIdForConnection(source, targetGroupId).then(() => {
				if (oldParentId === Constants.unsavedGroupId) {
					this.removeUnsavedConnection(oldId);
				}
				resolve();
			}, (error => {
				reject(error);
			}));
		});
	}

	private addGroupFullNameToMap(groupId: string, groupFullName: string): void {
		if (groupId) {
			this._groupIdToFullNameMap[groupId] = groupFullName;
		}
		if (groupFullName !== undefined) {
			this._groupFullNameToIdMap[groupFullName.toUpperCase()] = groupId;
		}
	}

	private getGroupFullName(groupId: string): string {
		if (groupId in this._groupIdToFullNameMap) {
			return this._groupIdToFullNameMap[groupId];
		} else {
			// Load the cache
			this.getConnectionProfileGroups(true);
		}
		return this._groupIdToFullNameMap[groupId];
	}

	private getGroupId(groupFullName: string): string {
		if (groupFullName === ConnectionProfileGroup.GroupNameSeparator) {
			groupFullName = '';
		}
		let key = groupFullName.toUpperCase();
		let result: string = '';
		if (key in this._groupFullNameToIdMap) {
			result = this._groupFullNameToIdMap[key];
		} else {
			// Load the cache
			this.getConnectionProfileGroups(true);
			result = this._groupFullNameToIdMap[key];
		}
		return result;
	}
}