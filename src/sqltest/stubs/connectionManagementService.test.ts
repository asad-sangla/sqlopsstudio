/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService, ConnectionManagementEvents } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IDisposable } from 'vs/base/common/lifecycle';
import data = require('data');


// Test stubs for commonly used objects

export class TestConnectionManagementService implements IConnectionManagementService {
	_serviceBrand: any;

	addEventListener(handle: number, events: ConnectionManagementEvents): IDisposable {
		return {
			dispose: () => {
			}
		};
	}

	newConnection(): void {

	}

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>{
		return new Promise(() => true);
	}

	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {

	}

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {

	}

	getConnectionGroups(): ConnectionProfileGroup[] {
		return [];
	}

	getActiveConnections(): data.ConnectionInfo[] {
		return [];
	}

	getRecentConnections(): data.ConnectionInfo[] {

		return [];
	}

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void> {
		return;
	}

	changeGroupIdForConnection(source: IConnectionProfile, targetGroupId: string): Promise<void> {
		return;
	}

	getAdvancedProperties(): data.ConnectionOption[] {
		return [];
	}

	connectEditor(fileUri: string, connection: ConnectionProfile): Promise<boolean>{
		return new Promise<boolean>(() => true);
	}

	disconnectEditor(fileUri: string): Promise<boolean>{
		return new Promise<boolean>(() => true);
	}
}