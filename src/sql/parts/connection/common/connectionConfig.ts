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
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { IConfigurationValue as TConfigurationValue } from 'vs/platform/configuration/common/configuration';
import { ConnectionProfile } from './connectionProfile';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
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
				this.addGroupFromProfile(profile).then(groupId => {
					let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
					if (!profiles) {
						profiles = [];
					}

					let providerCapabilities = this.getCapabilities(profile.providerName);
					let connectionProfile = this.getConnectionProfileInstance(profile, groupId);
					let newProfile = ConnectionProfile.convertToProfileStore(providerCapabilities, connectionProfile);

					// Remove the profile if already set
					var sameProfileInList = profiles.find(value => {
						let providerCapabilities = this.getCapabilities(value.providerName);
						let providerConnectionProfile = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
						return providerConnectionProfile.getOptionsKey() === connectionProfile.getOptionsKey();
					});
					if (sameProfileInList) {
						profiles = profiles.filter(value => value !== sameProfileInList);
						newProfile.id = sameProfileInList.id;
						connectionProfile.id = sameProfileInList.id;
					}

					profiles.push(newProfile);

					this.writeConfiguration(Constants.connectionsArrayName, profiles).then(() => {
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
	public addGroupFromProfile(profile: IConnectionProfile): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (profile.groupId && profile.groupId !== Utils.defaultGroupId) {
				resolve(profile.groupId);
			} else {
				let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
				let result = this.saveGroup(groups, profile.groupFullName, undefined, undefined);
				groups = result.groups;

				this.writeConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
					resolve(result.newGroupId);
				}).catch(err => {
					reject(err);
				});
			}
		});
	}

	/**
	 *Returns group id
	 * @param groupName
	 */
	public addGroup(profileGroup: IConnectionProfileGroup): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (profileGroup.id) {
				resolve(profileGroup.id);
			} else {
				let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
				let result = this.saveGroup(groups, profileGroup.name, profileGroup.color, profileGroup.description);
				groups = result.groups;

				this.writeConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
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
			profiles.forEach(profile => {
				if (!profile.id) {
					profile.id = Utils.generateGuid();
				}
			});
			this.writeConfiguration(Constants.connectionsArrayName, profiles, ConfigurationTarget.USER);
		}

		if (getWorkspaceConnections) {
			// Read from workspace settings

			let workspaceProfiles = this.getConfiguration(Constants.connectionsArrayName).workspace as IConnectionProfileStore[];

			if (workspaceProfiles !== undefined) {
				profiles = profiles.concat(workspaceProfiles);
				workspaceProfiles.forEach(profile => {
					if (!profile.id) {
						profile.id = Utils.generateGuid();
					}
				});
				this.writeConfiguration(Constants.connectionsArrayName, workspaceProfiles, ConfigurationTarget.WORKSPACE);
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
			return providerConnectionProfile.getOptionsKey() !== profile.getOptionsKey();
		});

		// Write connections back to settings
		return this.writeConfiguration(Constants.connectionsArrayName, profiles);
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
			return !connections.some((val) => val.getOptionsKey() === providerConnectionProfile.getOptionsKey());
		});

		// Get all groups in the settings
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		// Remove subgroups in the settings
		groups = groups.filter((grp) => {
			return !subgroups.some((item) => item.id === grp.id);
		});
		return new Promise<void>((resolve, reject) => {
			this.writeConfiguration(Constants.connectionsArrayName, profiles).then(() => {
				this.writeConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
					resolve();
				}).catch(() => reject());
			}).catch(() => reject());
		});
	}

	/**
	 * Moves the source group under the target group.
	 */
	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		groups = groups.map(g => {
			if (g.id === source.id) {
				g.parentId = target.id;
			}
			return g;
		});
		return this.writeConfiguration(Constants.connectionGroupsArrayName, groups);
	}

	/**
	 * Returns true if connection can be moved to another group
	 */
	public canChangeConnectionConfig(profile: ConnectionProfile, newGroupID: string): boolean {
		let profiles = this.getConnections(true);
		let existingProfile = profiles.find(p => p.getConnectionInfoId() === profile.getConnectionInfoId()
			&& p.groupId === newGroupID);
		return existingProfile === undefined;
	}

	/**
	 * Moves the connection under the target group with the new ID.
	 */
	private changeGroupIdForConnectionInSettings(profile: ConnectionProfile, newGroupID: string, target: ConfigurationTarget = ConfigurationTarget.USER): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let profiles = target === ConfigurationTarget.USER ? this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user :
				this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).workspace;
			if (profiles) {
				let providerCapabilities = this.getCapabilities(profile.providerName);
				if (profile.parent && profile.parent.id === Constants.unsavedGroupId) {
					profile.groupId = newGroupID;
					profiles.push(ConnectionProfile.convertToProfileStore(providerCapabilities, profile));
				} else {
					profiles.forEach((value) => {
						let configProf = ConnectionProfile.createFromStoredProfile(value, providerCapabilities);
						if (configProf.getOptionsKey() === profile.getOptionsKey()) {
							value.groupId = newGroupID;
						}
					});
				}

				this.writeConfiguration(Constants.connectionsArrayName, profiles, target).then(result => {
					resolve();
				}).catch(error => {
					reject(error);
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Moves the connection under the target group with the new ID.
	 */
	public changeGroupIdForConnection(profile: ConnectionProfile, newGroupID: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			if (!this.canChangeConnectionConfig(profile, newGroupID)) {
				// Same connection already exists in this group
				reject('Same connection already exists in the group');
			} else {
				this.changeGroupIdForConnectionInSettings(profile, newGroupID, ConfigurationTarget.USER).then(result1 => {
					this.changeGroupIdForConnectionInSettings(profile, newGroupID, ConfigurationTarget.WORKSPACE).then(result2 => {
						resolve();
					}).catch(error2 => {
						reject(error2);
					});
				}).catch(error1 => {
					reject(error1);
				});
			}
		});
	}

	public saveGroup(groups: IConnectionProfileGroup[], groupFullName: string, color: string, description: string): ISaveGroupResult {
		let result: ISaveGroupResult;
		let groupNames = ConnectionProfileGroup.getGroupFullNameParts(groupFullName);
		result = this.saveGroupInTree(groups, undefined, groupNames, color, description, 0);
		return result;
	}

	public editGroup(source: ConnectionProfileGroup): Promise<void> {
		let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
		groups = groups.map(g => {
			if (g.id === source.id) {
				g.name = source.name;
				g.description = source.description;
				g.color = source.color;
				source.isRenamed = false;
			}
			return g;
		});
		return this.writeConfiguration(Constants.connectionGroupsArrayName, groups);
	}

	private isSameGroupName(group1: IConnectionProfileGroup, group2: IConnectionProfileGroup): boolean {
		let sameGroupName: boolean = false;
		if (group1 && group2) {
			sameGroupName = ((!group1.name && !group2.name) || group1.name.toUpperCase() === group2.name.toUpperCase()) &&
				(group1.parentId === group2.parentId || (!group1.parentId && !group2.parentId));
		}
		return sameGroupName;
	}

	private saveGroupInTree(groupTree: IConnectionProfileGroup[], parentId: string, groupNames: string[], color: string, description: string, index: number): ISaveGroupResult {
		if (!groupTree) {
			groupTree = [];
		}
		let newGroupId: string;

		if (index < groupNames.length) {
			let groupName: string = groupNames[index];
			let newGroup: IConnectionProfileGroup = {
				name: groupName,
				id: undefined,
				parentId: parentId,
				color: color,
				description: description
			};
			let found = groupTree.find(group => this.isSameGroupName(group, newGroup));
			if (found) {
				if (index === groupNames.length - 1) {
					newGroupId = found.id;
					//Found the group full name
				} else {
					let result = this.saveGroupInTree(groupTree, found.id, groupNames, color, description, index + 1);
					groupTree = result.groups;
					newGroupId = result.newGroupId;
				}

			} else {
				if (ConnectionProfileGroup.isRoot(newGroup.name)) {
					newGroup.id = Utils.defaultGroupId;
				} else {
					newGroup.id = Utils.generateGuid();
				}
				let result = this.saveGroupInTree(groupTree, newGroup.id, groupNames, color, description, index + 1);
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
	private getConfiguration(key: string): TConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]> {
		let configs: TConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]>;

		configs = this._workspaceConfigurationService.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[]>(key);
		return configs;
	}

	/**
	 * Replace existing profiles in the settings file with a new set of profiles.
	 * @param parsedSettingsFile an object representing the parsed contents of the settings file.
	 * @param profiles the set of profiles to insert into the settings file.
	 */
	private writeConfiguration(
		key: string,
		profiles: IConnectionProfileStore[] | IConnectionProfileGroup[] | data.DataProtocolServerCapabilities[],
		target: ConfigurationTarget = ConfigurationTarget.USER): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let configValue: IConfigurationValue = {
				key: key,
				value: profiles
			};
			this._configurationEditService.writeConfiguration(target, configValue).then(result => {
				this._workspaceConfigurationService.reloadConfiguration().then(() => {
					resolve();
				});
			}, (error => {
				reject(error);
			}));
		});
	}
}
