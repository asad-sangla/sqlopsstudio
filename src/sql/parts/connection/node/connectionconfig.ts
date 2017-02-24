/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import * as Constants from 'sql/parts/connection/node/constants';
import * as Utils from 'sql/parts/connection/node/utils';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IConnectionConfig } from 'sql/parts/connection/node/iconnectionconfig';
import { ConnectionProfileGroup, IConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
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
        let workSpaceGroups = this.getConfiguration(Constants.connectionGroupsArrayName).workspace as IConnectionProfileGroup[];

        allGroups = this.mergeTree(userGroups, workSpaceGroups);
        return allGroups;
    }

    /**
     * Add a new connection to the connection config.
     */
    public addConnection(profile: IConnectionProfile): Promise<void> {
        this.addGroups(profile.groupName);
        let profiles = this._workspaceConfigurationService.lookup<IConnectionProfile[]>(Constants.connectionsArrayName).user;
        if(!profiles) {
            profiles = [];
        }

        // Remove the profile if already set
        profiles = profiles.filter(value => !Utils.isSameProfile(value, profile));
        profiles.push(profile);


        return this.writeUserConfiguration(Constants.connectionsArrayName, profiles);
    }

    public addGroups(group: string): Promise<void> {
        if(group && group !== '') {
            let groups = this._workspaceConfigurationService.lookup<IConnectionProfileGroup[]>(Constants.connectionGroupsArrayName).user;
            groups = this.saveGroup(groups, group);
            return this.writeUserConfiguration(Constants.connectionGroupsArrayName, groups);
        }
    }

    /**
     * Get a list of all connections in the connection config. Connections returned
     * are sorted first by whether they were found in the user/workspace settings,
     * and next alphabetically by profile/server name.
     */
    public getConnections(getWorkspaceConnections: boolean): IConnectionProfile[] {
        let profiles: IConnectionProfile[] = [];
        let compareProfileFunc = (a, b) => {
            // Sort by profile name if available, otherwise fall back to server name
            let nameA = a.profileName ? a.profileName : a.serverName;
            let nameB = b.profileName ? b.profileName : b.serverName;
            return nameA.localeCompare(nameB);
        };

        // Read from user settings

        let userProfiles = this.getConfiguration(Constants.connectionsArrayName).user as IConnectionProfile[];
        if(userProfiles !== undefined) {
            userProfiles.sort(compareProfileFunc);
            profiles = profiles.concat(userProfiles);
        }

        if (getWorkspaceConnections) {
            // Read from workspace settings

            let workspaceProfiles = this.getConfiguration(Constants.connectionsArrayName).workspace as IConnectionProfile[];
            if(workspaceProfiles !== undefined) {
                workspaceProfiles.sort(compareProfileFunc);
                profiles = profiles.concat(workspaceProfiles);
            }
        }

        if (profiles.length > 0) {
            profiles = profiles.filter(conn => {
                // filter any connection missing a server name or the sample that's shown by default
                return !!(conn.serverName) && conn.serverName !== Constants.SampleServerName;
            });
        }

        return profiles;
    }

    /**
     * Remove an existing connection from the connection config.
     */
    public removeConnection(profile: IConnectionProfile): Promise<boolean> {

        let profiles = this.getConfiguration(Constants.connectionGroupsArrayName).user as IConnectionProfile[];

        // Remove the profile if already set
        let found: boolean = false;
        profiles = profiles.filter(value => {

            if (Utils.isSameProfile(value, profile)) {
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

    private saveGroup(groups: IConnectionProfileGroup[], groupFullName: string): IConnectionProfileGroup[] {
        if(groupFullName !== undefined && groupFullName !== '') {
            let groupNames: string[] = groupFullName.split(ConnectionProfileGroup.GroupNameSeparator);
            return this.saveGroupsInTreeIfNotExist(groups, groupNames, 0);
        }
        return groups;
    }


    private mergeTree(tree1: IConnectionProfileGroup[], tree2: IConnectionProfileGroup[]): IConnectionProfileGroup[] {
        if(!tree1 && !tree2) {
            return [];
        } else if (!tree1) {
            return tree2;
        } else if (!tree2) {
            return tree1;
        }

        tree2.map(node2 => {
            let sameTreeNode = tree1.find(node1 => this.isSameGroupName(node1.name, node2.name));
            if(sameTreeNode) {
                sameTreeNode.children = this.mergeTree(sameTreeNode.children, node2.children);
            } else {
                tree1 = tree1.concat(node2);
            }

        });
        return tree1;
    }

    private isSameGroupName(groupName1: string, groupName2: string): boolean {
        return groupName1 === groupName2;
    }

    private saveGroupsInTreeIfNotExist(groupTree: IConnectionProfileGroup[], groupNames: string[], index: number): IConnectionProfileGroup[] {
        if(!groupTree) {
            groupTree = [];
        }
        if(index < groupNames.length) {
            let groupName: string = groupNames[index];
            let found = groupTree.find(group => this.isSameGroupName(group.name, groupName));
            if (found) {
                if (index === groupNames.length - 1) {
                    //Found the group full name
                } else {
                    found.children = this.saveGroupsInTreeIfNotExist(found.children, groupNames, index + 1);
                }

            } else {
                let newGroup: IConnectionProfileGroup = {
                    name: groupName,
                    children: undefined
                };
                newGroup.children = this.saveGroupsInTreeIfNotExist(newGroup.children, groupNames, index + 1);
                groupTree.push(newGroup);
            }
        }

        return groupTree;
    }

    /**
     * Get all profiles from the parsed settings file.
     * This is public for testing only.
     * @param parsedSettingsFile an object representing the parsed contents of the settings file.
     * @returns the set of connection profiles found in the parsed settings file.
     */
    private getConfiguration(key: string): IWorkspaceConfigurationValue<IConnectionProfile[] | IConnectionProfileGroup[]> {
        let profiles: IWorkspaceConfigurationValue<IConnectionProfile[] | IConnectionProfileGroup[]>;

        profiles = this._workspaceConfigurationService.lookup<IConnectionProfile[] | IConnectionProfileGroup[]>(key);
        return profiles;
    }

    /**
     * Replace existing profiles in the settings file with a new set of profiles.
     * @param parsedSettingsFile an object representing the parsed contents of the settings file.
     * @param profiles the set of profiles to insert into the settings file.
     */
    private writeUserConfiguration(key: string, profiles: IConnectionProfile[] | IConnectionProfileGroup[]): Promise<void> {
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
