/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as Constants from './constants';
import * as Utils from './utils';
import { IConnectionProfile, IConnectionProfileStore } from './interfaces';
import { IConnectionConfig } from './iconnectionConfig';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService, ConfigurationTarget, IConfigurationValue } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService, IWorkspaceConfigurationValue } from 'vs/workbench/services/configuration/common/configuration';
import { ConnectionProfile } from './connectionProfile';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import * as data from 'data';

export interface ISaveGroupResult {
	groups: IConnectionProfileGroup[];
	newGroupId: string;
}

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
	public addConnection(profile: IConnectionProfile): Promise<IConnectionProfile> {
		return new Promise<IConnectionProfile>((resolve, reject) => {
			if (profile.saveProfile) {
				this.addGroup(profile).then(groupId => {
					let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
					if (!profiles) {
						profiles = [];
					}

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
						resolve(connectionProfile);
					}).catch(err => {
						reject(err);
					});
				});
			}
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
				resolve(profile.groupId);
			} else {
				let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
				let result = this.saveGroup(groups, profile.groupFullName);
				groups = result.groups;

				this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
					resolve(result.newGroupId);
				}).catch(err => {
					reject(err);
				});
			}
		});
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
	 * Delete a connection profile from settings.
	 */
	public deleteConnection(profile: ConnectionProfile): Promise<void> {
		// Get all connections in the settings
		let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
		// Remove the profile from the connections
		profiles = profiles.filter(value => {
			let providerCapabilities = this.getCapabilities(value.providerName);
			let providerConnectionProfile = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
			return providerConnectionProfile.getUniqueId() !== profile.getUniqueId();
		});

		// Write connections back to settings
		return this.writeUserConfiguration(Constants.connectionsArrayName, profiles);
	}

	/**
	 *  Delete a group and all its child connections and groups from settings.
	 * 	Fails if writing to settings fails.
	 */
	public deleteGroup(group: ConnectionProfileGroup): Promise<void> {
		let connections = ConnectionProfileGroup.getConnectionsInGroup(group);
		let subgroups = ConnectionProfileGroup.getSubgroups(group);
		// Add selected group to subgroups list
		subgroups.push(group);
		// Get all connections in the settings
		let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
		// Remove the profiles from the connections
		profiles = profiles.filter(value => {
			let providerCapabilities = this.getCapabilities(value.providerName);
			let providerConnectionProfile = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
			return !connections.some((val) => val.getUniqueId() === providerConnectionProfile.getUniqueId());
		});

		// Get all groups in the settings
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		// Remove subgroups in the settings
		groups = groups.filter((grp) => {
			return !subgroups.some((item) => item.id === grp.id);
		});
		return new Promise<void>((resolve,reject) => {
			this.writeUserConfiguration(Constants.connectionsArrayName, profiles).then(() => {
				this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
					resolve();
				}).catch(() => reject());
			}).catch(() => reject());
		});
	}

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		groups = groups.map(g => {
			if (g.id === source.id) {
				g.parentId = target.id;
			}
			return g;
		});
		return this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups);
	}

	public changeGroupIdForConnection(profile: ConnectionProfile, newGroupID: string): Promise<void> {

		let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
		let providerCapabilities = this.getCapabilities(profile.providerName);
		if (profile.parent.id === Constants.unsavedGroupId) {
			profile.groupId = newGroupID;
			profiles.push(ConnectionProfile.convertToProfileStore(providerCapabilities, profile));
		} else {
			profiles.forEach((value) => {
				let configProf = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
				if (configProf.getUniqueId() === profile.getUniqueId()) {
					value.groupId = newGroupID;
				}
			});
		}
		return this.writeUserConfiguration(Constants.connectionsArrayName, profiles);
	}

	public saveGroup(groups: IConnectionProfileGroup[], groupFullName: string): ISaveGroupResult {
		let result: ISaveGroupResult;
		let groupNames = ConnectionProfileGroup.getGroupFullNameParts(groupFullName);
		result = this.saveGroupInTree(groups, undefined, groupNames, 0);
		return result;
	}

	public renameGroup(source: ConnectionProfileGroup): Promise<void> {
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		groups = groups.map(g => {
			if (g.id === source.id) {
				g.name = source.name;
				source.isRenamed = false;
			}
			return g;
		});
		return this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups);
	}

	private isSameGroupName(group1: IConnectionProfileGroup, group2: IConnectionProfileGroup): boolean {
		let sameGroupName: boolean = false;
		if (group1 && group2) {
			sameGroupName = ((Utils.isEmpty(group1.name) && Utils.isEmpty(group2.name)) || group1.name.toUpperCase() === group2.name.toUpperCase()) &&
				(group1.parentId === group2.parentId || (Utils.isEmpty(group1.parentId) && Utils.isEmpty(group2.parentId)));
		}
		return sameGroupName;
	}

	private saveGroupInTree(groupTree: IConnectionProfileGroup[], parentId: string, groupNames: string[], index: number): ISaveGroupResult {
		if (!groupTree) {
			groupTree = [];
		}
		let newGroupId: string;

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
					newGroupId = found.id;
					//Found the group full name
				} else {
					let result = this.saveGroupInTree(groupTree, found.id, groupNames, index + 1);
					groupTree = result.groups;
					newGroupId = result.newGroupId;
				}

			} else {
				newGroup.id = Utils.generateGuid();
				let result = this.saveGroupInTree(groupTree, newGroup.id, groupNames, index + 1);
				newGroupId = result.newGroupId;
				groupTree = result.groups;
				groupTree.push(newGroup);
				if (index === groupNames.length - 1) {
					newGroupId = newGroup.id;
				}
			}
		}
		let groupResult: ISaveGroupResult = {
			groups: groupTree,
			newGroupId: newGroupId
		};
		return groupResult;
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
				this._workspaceConfigurationService.reloadConfiguration().then(() => {
					resolve();
				});
			}, (error => {
				reject(error);
			}));
		});
	}
}
