/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService, IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import data = require('data');

// Test stubs for commonly used objects

export class TestConnectionManagementService implements IConnectionManagementService {
	_serviceBrand: any;
	onAddConnectionProfile = undefined;
	onDeleteConnectionProfile = undefined;
	onConnect = undefined;

	registerProvider(providerId: string, provider: data.ConnectionProvider): void {

	}

	newConnection(): void {

	}

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>{
		return new Promise(() => true);
	}

	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {

	}

	connect(uri: string, connection: IConnectionProfile): Promise<boolean> {
		return new Promise(() => true);
	}

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {

	}

	getConnectionGroups(): ConnectionProfileGroup[] {
		return [];
	}

	getActiveConnections(): data.ConnectionInfo[] {
		return [];
	}

	getRecentConnections(): ConnectionProfile[] {
		return [];
	}

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void> {
		return Promise.resolve();
	}

	changeGroupIdForConnection(source: IConnectionProfile, targetGroupId: string): Promise<void> {
		return Promise.resolve();
	}

	getAdvancedProperties(): data.ConnectionOption[] {
		return [];
	}

	isConnected(fileUri: string): boolean {
		return false;
	}

	connectProfile(connection: ConnectionProfile): Promise<boolean>{
		return new Promise(() => true);
	}

	connectEditor(owner: IConnectableInput, runQueryOnCompletion: boolean, connection: ConnectionProfile): Promise<boolean>{
		return new Promise<boolean>(() => true);
	}

	disconnectEditor(owner: IConnectableInput): Promise<boolean>{
		return new Promise<boolean>(() => true);
	}

	getCapabilities(): data.DataProtocolServerCapabilities[] {
		return [];
	}

	getConnectionProfile(fileUri: string): IConnectionProfile {
		return undefined;
	}

	addSavedPassword(connectionProfile: IConnectionProfile): Promise<IConnectionProfile> {
		return new Promise<IConnectionProfile>(() => connectionProfile);
	}

	cancelConnection(connection: IConnectionProfile): Thenable<boolean> {
		return undefined;
	}

	cancelEditorConnection(owner: IConnectableInput): Thenable<boolean> {
		return undefined;
	}
}