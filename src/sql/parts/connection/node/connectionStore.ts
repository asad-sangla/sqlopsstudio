/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Constants = require('./constants');
import ConnInfo = require('./connectionInfo');
import Utils = require('./utils');
import { ConnectionCredentials } from './connectionCredentials';
import { ConnectionProfile } from '../node/connectionProfile';
import { IConnectionProfile, CredentialsQuickPickItemType } from './interfaces';
import { ICredentialsService } from 'sql/parts/credentials/credentialsService';
import { IConnectionConfig } from './iconnectionconfig';
import { ConnectionConfig } from './connectionconfig';
import { Memento, Scope as MementoScope } from 'vs/workbench/common/memento';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import data = require('data');

/**
 * Manages the connections list including saved profiles and the most recently used connections
 *
 * @export
 * @class ConnectionStore
 */
export class ConnectionStore {

	private _memento: any;

	constructor(
		private _storageService: IStorageService,
		private _context: Memento,
		private _configurationEditService: IConfigurationEditingService,
		private _workspaceConfigurationService: IWorkspaceConfigurationService,
		private _credentialService: ICredentialsService,
		private _capabilitiesService: ICapabilitiesService,
		private _connectionConfig?: IConnectionConfig
	) {

		this._memento = this._context.getMemento(this._storageService, MementoScope.GLOBAL);

		if (!this._connectionConfig) {
			let cachedServerCapabilities = this.getCachedServerCapabilities();
			this._connectionConfig = new ConnectionConfig(this._configurationEditService,
				this._workspaceConfigurationService, this._capabilitiesService, cachedServerCapabilities);
			this._connectionConfig.setCachedMetadata(cachedServerCapabilities);
		}
	}

	public static get CRED_PREFIX(): string { return 'Microsoft.SqlTools'; }
	public static get CRED_SEPARATOR(): string { return '|'; }
	public static get CRED_SERVER_PREFIX(): string { return 'server:'; }
	public static get CRED_DB_PREFIX(): string { return 'db:'; }
	public static get CRED_USER_PREFIX(): string { return 'user:'; }
	public static get CRED_ITEMTYPE_PREFIX(): string { return 'itemtype:'; }
	public static get CRED_PROFILE_USER(): string { return CredentialsQuickPickItemType[CredentialsQuickPickItemType.Profile]; };
	public static get CRED_MRU_USER(): string { return CredentialsQuickPickItemType[CredentialsQuickPickItemType.Mru]; };

	public static formatCredentialIdForCred(creds: IConnectionProfile, itemType?: CredentialsQuickPickItemType): string {
		if (Utils.isEmpty(creds)) {
			throw new Error('Missing Connection which is required');
		}
		let itemTypeString: string = ConnectionStore.CRED_PROFILE_USER;
		if (itemType) {
			itemTypeString = CredentialsQuickPickItemType[itemType];
		}
		return ConnectionStore.formatCredentialId(creds.serverName, creds.databaseName, creds.userName, itemTypeString);
	}

	/**
	 * Creates a formatted credential usable for uniquely identifying a SQL Connection.
	 * This string can be decoded but is not optimized for this.
	 * @static
	 * @param {string} server name of the server - required
	 * @param {string} database name of the database - optional
	 * @param {string} user name of the user - optional
	 * @param {string} itemType type of the item (MRU or Profile) - optional
	 * @returns {string} formatted string with server, DB and username
	 */
	public static formatCredentialId(server: string, database?: string, user?: string, itemType?: string): string {
		if (Utils.isEmpty(server)) {
			throw new Error('Missing Server Name, which is required');
		}
		let cred: string[] = [ConnectionStore.CRED_PREFIX];
		if (!itemType) {
			itemType = ConnectionStore.CRED_PROFILE_USER;
		}

		ConnectionStore.pushIfNonEmpty(itemType, ConnectionStore.CRED_ITEMTYPE_PREFIX, cred);
		ConnectionStore.pushIfNonEmpty(server, ConnectionStore.CRED_SERVER_PREFIX, cred);
		ConnectionStore.pushIfNonEmpty(database, ConnectionStore.CRED_DB_PREFIX, cred);
		ConnectionStore.pushIfNonEmpty(user, ConnectionStore.CRED_USER_PREFIX, cred);
		return cred.join(ConnectionStore.CRED_SEPARATOR);
	}

	private static pushIfNonEmpty(value: string, prefix: string, arr: string[]): void {
		if (Utils.isNotEmpty(value)) {
			arr.push(prefix.concat(value));
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
			if (ConnectionCredentials.isPasswordBasedCredential(credentialsItem)
				&& Utils.isEmpty(credentialsItem.password)) {

				let credentialId = ConnectionStore.formatCredentialIdForCred(credentialsItem, undefined);
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

			self._connectionConfig.addConnection(savedProfile)
				.then(() => {
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

	private getCachedServerCapabilities(): data.DataProtocolServerCapabilities[] {
		if (this._memento) {
			let metadata: data.DataProtocolServerCapabilities[] = this._memento['OPTIONS_METADATA'];
			return metadata;
		} else {
			return undefined;
		}

	}

	private saveCachedServerCapabilities(): void {
		if (this._memento) {
			let capabilities = this._capabilitiesService.getCapabilities();
			this._memento['OPTIONS_METADATA'] = capabilities;
		}
	}

	/**
	 * Gets the list of recently used connections. These will not include the password - a separate call to
	 * {addSavedPassword} is needed to fill that before connecting
	 *
	 * @returns {data.ConnectionInfo} the array of connections, empty if none are found
	 */
	public getRecentlyUsedConnections(): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento['RECENT_CONNECTIONS'];
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
				return connectionProfile;
			} else {
				return undefined;
			};
		});
	}

	/**
	 * Moves all the active connections to recent connections list and clears active connections list.
	 * To be called before shutdown.
	 */
	public saveActiveConnectionsToRecent(): void {
		let activeConnections: IConnectionProfile[] = this._memento['ACTIVE_CONNECTIONS'];
		let recentConnections: IConnectionProfile[] = this._memento['RECENT_CONNECTIONS'];
		recentConnections = activeConnections.concat(recentConnections);
		let maxConnections = this.getMaxRecentConnectionsCount();
		// Remove last element if needed
		if (recentConnections.length > maxConnections) {
			recentConnections = recentConnections.slice(0, maxConnections);
		}

		this._memento['RECENT_CONNECTIONS'] = recentConnections;
		this._memento['ACTIVE_CONNECTIONS'] = [];
	}

	/**
	 * Gets the list of active connections. These will not include the password - a separate call to
	 * {addSavedPassword} is needed to fill that before connecting
	 *
	 * @returns {data.ConnectionInfo} the array of connections, empty if none are found
	 */
	public getActiveConnections(): ConnectionProfile[] {
		let configValues: IConnectionProfile[] = this._memento['ACTIVE_CONNECTIONS'];
		if (!configValues) {
			configValues = [];
		}

		return this.convertConfigValuesToConnectionProfiles(configValues);
	}

	public getProfileWithoutPassword(conn: IConnectionProfile): ConnectionProfile {
		let savedConn: ConnectionProfile = undefined;
		let connectionProfileInstance = conn as ConnectionProfile;
		if (connectionProfileInstance) {
			savedConn = connectionProfileInstance.withoutPassword();
		} else {
			// Add the connection to the front of the list, taking care to clear out the password field
			let connProfile: IConnectionProfile = Object.assign({}, conn, { password: '' });
			savedConn = new ConnectionProfile(this._connectionConfig.getCapabilities(conn.providerName), connProfile);
		}

		return savedConn;
	}

	/**
	 * Adds a connection to the active connections list.
	 * Password values are stored to a separate credential store if the "savePassword" option is true
	 *
	 * @param {IConnectionCredentials} conn the connection to add
	 * @returns {Promise<void>} a Promise that returns when the connection was saved
	 */
	public addActiveConnection(conn: IConnectionProfile): Promise<void> {

		const self = this;
		return new Promise<void>((resolve, reject) => {
			// Get all profiles
			let configValues = self.getActiveConnections();
			let savedProfile: ConnectionProfile = this.getProfileWithoutPassword(conn);

			// Remove the connection from the list if it already exists
			configValues = configValues.filter(value => value.getUniqueId() !== savedProfile.getUniqueId());

			configValues.unshift(savedProfile);


			let configToSave = configValues.map(c => {
				return c.toIConnectionProfile();
			});
			self._memento['ACTIVE_CONNECTIONS'] = configToSave;
			self.doSavePassword(conn, CredentialsQuickPickItemType.Mru);
			resolve(undefined);
		});
	}

	/**
	 * Clear all recently used connections from the MRU list.
	 */
	public clearRecentlyUsed(): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			self._memento['RECENT_CONNECTIONS'] = [];
			resolve();
		});
	}

	/**
	 * Clear all active connections from the MRU list.
	 */
	public clearActiveConnections(): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			self._memento['ACTIVE_CONNECTIONS'] = [];
			resolve();
		});
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
			self._memento['RECENT_CONNECTIONS'] = configValues;
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
			self._memento['ACTIVE_CONNECTIONS'] = configValues;
		});
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
				let credentialId = ConnectionStore.formatCredentialId(conn.serverName, conn.databaseName, conn.userName, credType);
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

	/**
	 * Removes a profile from the user settings and deletes any related password information
	 * from the credential store
	 *
	 * @param {IConnectionProfile} profile the profile to be removed
	 * @param {Boolean} keepCredentialStore optional value to keep the credential store after a profile removal
	 * @returns {Promise<boolean>} true if successful
	 */
	public removeProfile(profile: IConnectionProfile, keepCredentialStore: boolean = false): Promise<boolean> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			self._connectionConfig.removeConnection(profile).then(profileFound => {
				resolve(profileFound);
			}).catch(err => {
				reject(err);
			});
		}).then(profileFound => {
			// Remove the profile from the recently used list if necessary
			return new Promise<boolean>((resolve, reject) => {
				self.removeRecentlyUsed(profile).then(() => {
					self.removeActiveConnection(profile).then(() => {
						resolve(profileFound);
					}).catch(err => {
						reject(err);
					});
				}).catch(err => {
					reject(err);
				});
			});
		}).then(profileFound => {
			// Now remove password from credential store. Currently do not care about status unless an error occurred
			if (profile.savePassword === true && !keepCredentialStore) {
				let credentialId = ConnectionStore.formatCredentialId(profile.serverName, profile.databaseName, profile.userName, ConnectionStore.CRED_PROFILE_USER);
				self._credentialService.deleteCredential(credentialId).then(undefined, rejected => {
					throw new Error(rejected);
				});
			}

			return profileFound;
		});
	}

	public getConnectionProfileGroups(): ConnectionProfileGroup[] {
		let profilesInConfiguration = this._connectionConfig.getConnections(true);
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
				let connectionsForGroup = connections.filter(conn => conn.groupId === connectionGroup.id);
				var conns = [];
				connectionsForGroup.forEach((conn) => {
					conns.push(conn);
				});
				connectionGroup.addConnections(conns);

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

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		return this._connectionConfig.changeGroupIdForConnectionGroup(source, target);
	}

	public changeGroupIdForConnection(source: IConnectionProfile, targetGroupId: string): Promise<void> {
		return this._connectionConfig.changeGroupIdForConnection(source, targetGroupId);
	}
}