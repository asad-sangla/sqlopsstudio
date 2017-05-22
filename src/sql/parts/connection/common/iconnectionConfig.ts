/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionProfile } from './interfaces';
import { IConnectionProfileGroup, ConnectionProfileGroup } from './connectionProfileGroup';
import { ConnectionProfile } from './connectionProfile';
import data = require('data');

/**
 * Interface for a configuration file that stores connection profiles.
 *
 * @export
 * @interface IConnectionConfig
 */
export interface IConnectionConfig {
	addConnection(profile: IConnectionProfile): Promise<IConnectionProfile>;
	addGroup(profileGroup: IConnectionProfileGroup): Promise<string>;
	getConnections(getWorkspaceConnections: boolean): ConnectionProfile[];
	getAllGroups(): IConnectionProfileGroup[];
	changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void>;
	changeGroupIdForConnection(source: ConnectionProfile, targetGroupId: string): Promise<void>;
	setCachedMetadata(cachedMetaData: data.DataProtocolServerCapabilities[]): void;
	getCapabilities(providerName: string): data.DataProtocolServerCapabilities;
	renameGroup(group: ConnectionProfileGroup): Promise<void>;
	deleteConnection(profile: ConnectionProfile): Promise<void>;
	deleteGroup(group: ConnectionProfileGroup): Promise<void>;
}
