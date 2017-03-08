/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService, ConnectionManagementEvents } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IDisposable } from 'vs/base/common/lifecycle';
import vscode = require('vscode');


// Test stubs for commonly used objects

export class TestConnectionManagementService implements IConnectionManagementService {
	_serviceBrand: any;

	addEventListener(handle: number, events: ConnectionManagementEvents): IDisposable {
		return {
			dispose: () => {
			}
		};
	}

	newConnection(){

	}

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>{
		return new Promise(() => true);
	}

	onConnectionComplete(handle: number, connectionInfoSummary: vscode.ConnectionInfoSummary): void {

	}

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {

	}

	getConnections(): ConnectionProfileGroup[] {
		return [];
	}

	getRecentConnections(): vscode.ConnectionInfo[] {
		return [];
	}

	updateGroups(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void> {
		return;
	}

	changeGroupNameForGroup(sourceGroupName: string, targetGroupName: string): Promise<void> {
		return;
	}

	changeGroupNameForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void> {
		return;
	}

	getAdvancedProperties(): vscode.ConnectionOption[] {
		return [];
	}
}