/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile } from './interfaces';
import { ConnectionProfile } from './connectionProfile';
import { IConnectionProfileGroup, ConnectionProfileGroup } from './connectionProfileGroup';
import vscode = require('vscode');

/**
 * Interface for a configuration file that stores connection profiles.
 *
 * @export
 * @interface IConnectionConfig
 */
export interface IConnectionConfig {
    addConnection(profile: IConnectionProfile): Promise<void>;
    getConnections(getWorkspaceConnections: boolean): IConnectionProfile[];
    removeConnection(profile: IConnectionProfile): Promise<boolean>;
    getAllGroups(): IConnectionProfileGroup[];
    updateGroups(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void>;
    changeGroupNameForGroup(sourceGroupName: string, targetGroupName: string): Promise<void>;
    changeGroupNameForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void>;
}
