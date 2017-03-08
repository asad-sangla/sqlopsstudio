/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';
import * as Constants from './constants';
import * as Utils from './utils';
import { IConnectionProfile, IConnectionProfileStore } from './interfaces';
import { IConnectionConfig } from './iconnectionconfig';
import { ConnectionProfile } from './connectionProfile';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IConfigurationEditingService, ConfigurationTarget, IConfigurationValue } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService, IWorkspaceConfigurationValue } from 'vs/workbench/services/configuration/common/configuration';
import vscode = require('vscode');

/**
 * Implements connection profile file storage.
 */
export class ConnectionConfig implements IConnectionConfig {

    /**
     * Constructor.
     */
    public constructor(
        private _configurationEditService: IConfigurationEditingService,
        private _workspaceConfigurationService: IWorkspaceConfigurationService
        ) {
    }

   /**
    * Returns connection groups from user and workspace settings.
    */
    public getAllGroups(): IConnectionProfileGroup[] {

        let allGroups: IConnectionProfileGroup[] = [];
        let userGroups = this.getConfiguration(Constants.connectionGroupsArrayName).user as IConnectionProfileGroup[];
        let workspaceGroups = this.getConfiguration(Constants.connectionGroupsArrayName).workspace as IConnectionProfileGroup[];

        if(userGroups) {

            if(workspaceGroups) {
                userGroups = userGroups.filter(x => workspaceGroups.find(f => this.isSameGroupName(f, x)) === undefined);
                allGroups = allGroups.concat(workspaceGroups);
            }
            allGroups = allGroups.concat(userGroups);
        }
        allGroups = allGroups.map(g => {
            if(g.parentId === '' || !g.parentId){
                g.parentId = undefined;
            }
            return g;
        });
        return allGroups;
    }

    /**
     * Add a new connection to the connection config.
     */
    public addConnection(profile: IConnectionProfile): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.addGroup(profile).then(groupId => {
                let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
                if(!profiles) {
                    profiles = [];
                }

                let newProfile = this.convertToConnectionProfileStore(profile, groupId);

                // Remove the profile if already set
                profiles = profiles.filter(value => !Utils.isSameProfileStore(value, newProfile));
                profiles.push(newProfile);


                this.writeUserConfiguration(Constants.connectionsArrayName, profiles).then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            });

        });
    }

    private convertToConnectionProfileStore(profile: IConnectionProfile, groupId: string): IConnectionProfileStore {
         let newProfile: IConnectionProfileStore = Object.assign({}, {options: {
                }, groupId: groupId, providerName:'MSSQL'});

                //TODO: get the options from connection profile options. Hard coded for now for MSSQL
                newProfile.options['serverName'] = profile.serverName;
                newProfile.options['databaseName'] = profile.databaseName;
                newProfile.options['userName'] = profile.userName;
                newProfile.options['password'] = profile.password;
                newProfile.options['authenticationType'] = profile.authenticationType;
            return newProfile;
    }


    /**
     *Returns group id
     * @param groupName
     */
    public addGroup(profile: IConnectionProfile): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if(profile.groupId) {
                return profile.groupId;
            } else if(profile.groupName && profile.groupName !== '') {
                let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
                groups = this.saveGroup(groups, profile.groupName);
                let group = this.findGroupInUserSettings(groups, profile.groupName);

                this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups).then(() => {
                    resolve(group ? group.id : undefined);
                }).catch(err => {
                    reject(err);
                });
            } else{
                resolve(undefined);
            }
        });
    }

    private findGroupInUserSettings(groups: IConnectionProfileGroup[], groupFullName: string): IConnectionProfileGroup {
         if (groupFullName !== undefined && groupFullName !== '') {
            let groupNames: string[] = groupFullName.split(ConnectionProfileGroup.GroupNameSeparator);
             return this.findGroupInTree(groups, undefined, groupNames, 0);
         }
    }

    /**
     * Get a list of all connections in the connection config. Connections returned
     * are sorted first by whether they were found in the user/workspace settings,
     * and next alphabetically by profile/server name.
     */
    public getConnections(getWorkspaceConnections: boolean): IConnectionProfile[] {
        let profiles: IConnectionProfileStore[] = [];
        let compareProfileFunc = (a, b) => {
            // Sort by profile name if available, otherwise fall back to server name
            let nameA = a.profileName ? a.profileName : a.options['serverName'];
            let nameB = b.profileName ? b.profileName : b.options['serverName'];
            return nameA.localeCompare(nameB);
        };

        // Read from user settings

        let userProfiles = this.getConfiguration(Constants.connectionsArrayName).user as IConnectionProfileStore[];
        if(userProfiles !== undefined) {
            userProfiles.sort(compareProfileFunc);
            profiles = profiles.concat(userProfiles);
        }

        if (getWorkspaceConnections) {
            // Read from workspace settings

            let workspaceProfiles = this.getConfiguration(Constants.connectionsArrayName).workspace as IConnectionProfileStore[];
            if(workspaceProfiles !== undefined) {
                workspaceProfiles.sort(compareProfileFunc);
                profiles = profiles.concat(workspaceProfiles);
            }
        }

        let connectionProfiles: IConnectionProfile[] = profiles.map(p => {
            let connectionProfile: IConnectionProfile = {
                authenticationType: p.options['authenticationType'],
                serverName: p.options['serverName'],
                databaseName: p.options['databaseName'],
                userName: p.options['userName'],
                password: p.options['password'],
                savePassword: true,
                groupName: undefined,
                groupId: p.groupId
            };
            return connectionProfile;
        });
        if (connectionProfiles.length > 0) {
            connectionProfiles = connectionProfiles.filter(conn => {
                // filter any connection missing a server name or the sample that's shown by default
                return !!(conn.serverName) && conn.serverName !== Constants.SampleServerName;
            });
        }

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
        let newProfile = this.convertToConnectionProfileStore(profile, group ? group.id : undefined);
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

    public changeGroupNameForGroup(sourceGroupName: string, targetGroupName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            resolve();
        });

    }

    public changeGroupNameForConnection(profile: IConnectionProfile, groupName: string): Promise<void> {

        let profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[]>(Constants.connectionsArrayName).user;
        let configProfile = this.convertToConnectionProfileStore(profile, profile.groupId);

        profiles.forEach((value) => {
            if (Utils.isSameProfileStore(value, configProfile)) {
                value.groupId = groupName;
            }
        });
        return this.writeUserConfiguration(Constants.connectionsArrayName, profiles);
    }

    public updateGroups(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
        let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
        let updatedGroups = groups.map(g => {
            if(g.id === source.id) {
                g.parentId = source.getParent().id;
            } else if(g.id === target.id) {
                g.parentId = target.getParent().id;
            }
            return g;
        });

        return this.writeUserConfiguration(Constants.connectionGroupsArrayName, updatedGroups);
	}

    private saveGroup(groups: IConnectionProfileGroup[], groupFullName: string): IConnectionProfileGroup[] {

        if (groupFullName !== undefined && groupFullName !== '') {
            let groupNames: string[] = groupFullName.split(ConnectionProfileGroup.GroupNameSeparator);
            groups = this.saveGroupInTree(groups, undefined, groupNames, 0);
        }
        return groups;
    }


    private isSameGroupName(group1: IConnectionProfileGroup, group2: IConnectionProfileGroup): boolean {
        return group1.name === group2.name && group1.parentId === group2.parentId;
    }

    private saveGroupInTree(groupTree: IConnectionProfileGroup[], parentId: string, groupNames: string[], index: number): IConnectionProfileGroup[] {
        if(!groupTree) {
            groupTree = [];
        }

        if(index < groupNames.length) {
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
        if(!groupTree) {
            groupTree = [];
        }
        let result: IConnectionProfileGroup = undefined;

        if(index < groupNames.length) {
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
    private getConfiguration(key: string): IWorkspaceConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[]> {
        let profiles: IWorkspaceConfigurationValue<IConnectionProfileStore[] | IConnectionProfileGroup[]>;

        profiles = this._workspaceConfigurationService.lookup<IConnectionProfileStore[] | IConnectionProfileGroup[]>(key);
        return profiles;
    }

    /**
     * Replace existing profiles in the settings file with a new set of profiles.
     * @param parsedSettingsFile an object representing the parsed contents of the settings file.
     * @param profiles the set of profiles to insert into the settings file.
     */
    private writeUserConfiguration(key: string, profiles: IConnectionProfileStore[] | IConnectionProfileGroup[]): Promise<void> {
        const self = this;
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
