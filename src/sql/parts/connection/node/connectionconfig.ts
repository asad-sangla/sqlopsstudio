/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as Constants from './constants';
import * as Utils from './utils';
import { IConnectionProfile, IConnectionProfileStore } from './interfaces';
import { IConnectionConfig } from './iconnectionconfig';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService, ConfigurationTarget, IConfigurationValue } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService, IWorkspaceConfigurationValue } from 'vs/workbench/services/configuration/common/configuration';
import { ConnectionProfile } from './connectionProfile';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import * as data from 'data';


/**
 * Implements connection profile file storage.
 */
export class ConnectionConfig implements IConnectionConfig {

	private _providerCapabilitiesMap: { [providerName: string]: data.DataProtocolServerCapabilities };
	private _providerCachedCapabilitiesMap: { [providerName: string]: data.DataProtocolServerCapabilities };
	/**
	 * Constructor.
	 */
	public constructor(
		private _configurationEditService: IConfigurationEditingService,
		private _workspaceConfigurationService: IWorkspaceConfigurationService,
		private _capabilitiesService: ICapabilitiesService,
		private _cachedMetadata?: data.DataProtocolServerCapabilities[]
	) {
		this._providerCapabilitiesMap = {};
		this._providerCachedCapabilitiesMap = {};
	}

	public setCachedMetadata(cachedMetaData: data.DataProtocolServerCapabilities[]): void {
		this._cachedMetadata = cachedMetaData;
	}

	/**
	 * Returns connection groups from user and workspace settings.
	 */
	public getAllGroups(): IConnectionProfileGroup[] {

		let allGroups: IConnectionProfileGroup[] = [];
		let userGroups = this.getConfiguration(Constants.connectionGroupsArrayName).user as IConnectionProfileGroup[];
		let workspaceGroups = this.getConfiguration(Constants.connectionGroupsArrayName).workspace as IConnectionProfileGroup[];

		if (userGroups) {

			if (workspaceGroups) {
				userGroups = userGroups.filter(x => workspaceGroups.find(f => this.isSameGroupName(f, x)) === undefined);
				allGroups = allGroups.concat(workspaceGroups);
			}
			allGroups = allGroups.concat(userGroups);
		}
		allGroups = allGroups.map(g => {
			if (g.parentId === '' || !g.parentId) {
				g.parentId = undefined;
			}
			return g;
		});
		return allGroups;
	}

	/**
	* Returns the capabilities for given provider name. First tries to get it from capabilitiesService and if it's not registered yet,
	* Gets the data from the metadata stored in the config
	* @param providerName Provider Name
	*/
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

		if (!result && this._cachedMetadata) {
			if (providerName in this._providerCachedCapabilitiesMap) {
				result = this._providerCachedCapabilitiesMap[providerName];
			} else {
				let metaDataFromConfig = this._cachedMetadata;
				if (metaDataFromConfig) {
					let providerCapabilities = metaDataFromConfig.find(m => m.providerName === providerName);
					this._providerCachedCapabilitiesMap[providerName] = providerCapabilities;
					result = providerCapabilities;
				}
			}
		}

		return result;

	}
	/**
	 * Add a new connection to the connection config.
	 */
	public addConnection(profile: IConnectionProfile): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.addGroup(profile).then(groupId => {
				let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
				if (!profiles) {
					profiles = [];
				}

				let capabilities = this._capabilitiesService.getCapabilities();
				let providerCapabilities = this.getCapabilities(profile.providerName);
				let connectionProfile = this.getConnectionProfileInstance(profile, groupId);
				let newProfile = ConnectionProfile.convertToProfileStore(providerCapabilities, connectionProfile);

				// Remove the profile if already set
				profiles = profiles.filter(value => {
					let providerCapabilities = this.getCapabilities(value.providerName);
					let providerConnectionProfile = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
					return providerConnectionProfile.getUniqueId() !== connectionProfile.getUniqueId();
				});
				profiles.push(newProfile);

				this.writeUserConfiguration(Constants.connectionsArrayName, profiles).then(() => {
					this.writeUserConfiguration(Constants.connectionMetadata, capabilities).then(() => {
						resolve();
					}).catch(err => {
						reject(err);
					});
				}).catch(err => {
					reject(err);
				});
			});

		});
	}

	private getConnectionProfileInstance(profile: IConnectionProfile, groupId: string): ConnectionProfile {
		let connectionProfile = profile as ConnectionProfile;
		let providerCapabilities = this.getCapabilities(profile.providerName);
		if (connectionProfile === undefined) {
			connectionProfile = new ConnectionProfile(providerCapabilities, profile);
		}
		connectionProfile.groupId = groupId;
		return connectionProfile;
	}

	/**
	 *Returns group id
	 * @param groupName
	 */
	public addGroup(profile: IConnectionProfile): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (profile.groupId) {
				return profile.groupId;
			} else if (profile.groupName && profile.groupName !== '') {
				let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
				groups = this.saveGroup(groups, profile.groupName);
				let group = this.findGroupInUserSettings(groups, profile.groupName);

				this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
					resolve(group ? group.id : undefined);
				}).catch(err => {
					reject(err);
				});
			} else {
				return resolve(undefined);
			}
		});
	}

	private findGroupInUserSettings(groups: IConnectionProfileGroup[], groupFullName: string): IConnectionProfileGroup {
		if (groupFullName !== undefined && groupFullName !== '') {
			let groupNames: string[] = groupFullName.split(ConnectionProfileGroup.GroupNameSeparator);
			return this.findGroupInTree(groups, undefined, groupNames, 0);
		} else {
			return undefined;
		}
	}

	/**
	 * Get a list of all connections in the connection config. Connections returned
	 * are sorted first by whether they were found in the user/workspace settings,
	 * and next alphabetically by profile/server name.
	 */
	public getConnections(getWorkspaceConnections: boolean): ConnectionProfile[] {
		let profiles: IConnectionProfileStore[] = [];
		//TODO: have to figure out how to sort connections for all provider
		// Read from user settings

		let userProfiles = this.getConfiguration(Constants.connectionsArrayName).user as IConnectionProfileStore[];

		if (userProfiles !== undefined) {
			profiles = profiles.concat(userProfiles);
		}

		if (getWorkspaceConnections) {
			// Read from workspace settings

			let workspaceProfiles = this.getConfiguration(Constants.connectionsArrayName).workspace as IConnectionProfileStore[];

			if (workspaceProfiles !== undefined) {
				profiles = profiles.concat(workspaceProfiles);
			}
		}

		let connectionProfiles = profiles.map(p => {
			let capabilitiesForProvider = this.getCapabilities(p.providerName);

			let providerConnectionProfile = ConnectionProfile.createFromStoredProfile(p, capabilitiesForProvider);
			providerConnectionProfile.setServerCapabilities(capabilitiesForProvider);
			this._capabilitiesService.onProviderRegisteredEvent((serverCapabilities) => {
				providerConnectionProfile.onProviderRegistered(serverCapabilities);
			});
			return providerConnectionProfile;
		});

		return connectionProfiles;
	}

	/**
	 * Remove an existing connection from the connection config.
	 */
	public removeConnection(profile: IConnectionProfile): Promise<boolean> {

		let profiles = this.getConfiguration(Constants.connectionGroupsArrayName).user as IConnectionProfileStore[];

		// Remove the profile if already set
		let found: boolean = false;
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		let group = this.findGroupInUserSettings(groups, profile.groupName);

		let providerCapabilities = this.getCapabilities(profile.providerName);
		let connectionProfile = this.getConnectionProfileInstance(profile, group ? group.id : undefined);
		let newProfile = ConnectionProfile.convertToProfileStore(providerCapabilities, connectionProfile);
		profiles = profiles.filter(value => {

			if (Utils.isSameProfileStore(value, newProfile)) {
				// remove just this profile
				found = true;
				return false;
			} else {
				return true;
			}

		});

		return new Promise<boolean>((resolve, reject) => {
			this.writeUserConfiguration(Constants.connectionsArrayName, profiles).then(() => {
				resolve(found);
			}).catch(err => {
				reject(err);
			});
		});
	}

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		let updatedGroups = groups.map(g => {
			if (g.id === source.id) {
				g.parentId = target.id;
			}
			return g;
		});

		return this.writeUserConfiguration(Constants.connectionGroupsArrayName, updatedGroups);

	}

	public changeGroupIdForConnection(profile: IConnectionProfile, newGroupID: string): Promise<void> {

		let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
		let providerCapabilities = this.getCapabilities(profile.providerName);
		let connectionProfile = this.getConnectionProfileInstance(profile, profile.groupId);
		let configProfile = ConnectionProfile.convertToProfileStore(providerCapabilities, connectionProfile);

		profiles.forEach((value) => {
			if (Utils.isSameProfileStore(value, configProfile)) {
				value.groupId = newGroupID;
			}
		});
		return this.writeUserConfiguration(Constants.connectionsArrayName, profiles);
	}

	private saveGroup(groups: IConnectionProfileGroup[], groupFullName: string): IConnectionProfileGroup[] {

		if (groupFullName !== undefined && groupFullName !== '') {
			let groupNames: string[] = groupFullName.split(ConnectionProfileGroup.GroupNameSeparator);
			groups = this.saveGroupInTree(groups, undefined, groupNames, 0);
		}
		return groups;
	}


	private isSameGroupName(group1: IConnectionProfileGroup, group2: IConnectionProfileGroup): boolean {
		return group1.name === group2.name &&
			(group1.parentId === group2.parentId || (Utils.isEmpty(group1.parentId) && Utils.isEmpty(group2.parentId)));
	}

	private saveGroupInTree(groupTree: IConnectionProfileGroup[], parentId: string, groupNames: string[], index: number): IConnectionProfileGroup[] {
		if (!groupTree) {
			groupTree = [];
		}

		if (index < groupNames.length) {
			let groupName: string = groupNames[index];
			let newGroup: IConnectionProfileGroup = {
				name: groupName,
				id: undefined,
				parentId: parentId
			};
			let found = groupTree.find(group => this.isSameGroupName(group, newGroup));
			if (found) {
				if (index === groupNames.length - 1) {
					//Found the group full name
				} else {
					groupTree = this.saveGroupInTree(groupTree, found.id, groupNames, index + 1);
				}

			} else {
				newGroup.id = Utils.generateGuid();
				groupTree = this.saveGroupInTree(groupTree, newGroup.id, groupNames, index + 1);
				groupTree.push(newGroup);
			}
		}

		return groupTree;
	}

	private findGroupInTree(groupTree: IConnectionProfileGroup[], parentId: string, groupNames: string[], index: number): IConnectionProfileGroup {
		if (!groupTree) {
			groupTree = [];
		}
		let result: IConnectionProfileGroup = undefined;

		if (index < groupNames.length) {
			let groupName: string = groupNames[index];
			let newGroup: IConnectionProfileGroup = {
				name: groupName,
				id: undefined,
				parentId: parentId
			};
			let found = groupTree.find(group => this.isSameGroupName(group, newGroup));
			if (found) {
				if (index === groupNames.length - 1) {
					result = found;
				} else {
					result = this.findGroupInTree(groupTree, found.id, groupNames, index + 1);
				}

			} else {
				result = this.findGroupInTree(groupTree, newGroup.id, groupNames, index + 1);
			}
		}

		return result;
	}

	/**
	 * Get all profiles from the parsed settings file.
	 * This is public for testing only.
	 * @param parsedSettingsFile an object representing the parsed contents of the settings file.
	 * @returns the set of connection profiles found in the parsed settings file.
	 */
	private getConfiguration(key: string): IWorkspaceConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]> {
		let configs: IWorkspaceConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]>;

		configs = this._workspaceConfigurationService.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]>(key);
		return configs;
	}

	/**
	 * Replace existing profiles in the settings file with a new set of profiles.
	 * @param parsedSettingsFile an object representing the parsed contents of the settings file.
	 * @param profiles the set of profiles to insert into the settings file.
	 */
	private writeUserConfiguration(key: string, profiles: IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let configValue: IConfigurationValue = {
				key: key,
				value: profiles
			};
			this._configurationEditService.writeConfiguration(ConfigurationTarget.USER, configValue).then(result => {
				resolve();
			}, (error => {
				reject(error);
			}));
		});
	}
}
