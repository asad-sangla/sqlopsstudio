/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import data = require('data');

// Test stubs for commonly used objects

export class ObjectExplorerProviderTestService implements data.ObjectExplorerProvider {

	public createNewSession(connInfo: data.ConnectionInfo): Thenable<data.ObjectExplorerSession> {
		return Promise.resolve(undefined);
	}

	public expandNode(nodeInfo: data.ExpandNodeInfo): Thenable<data.ObjectExplorerExpandInfo> {
		return Promise.resolve(undefined);
	}

	public refreshNode(nodeInfo: data.ExpandNodeInfo): Thenable<data.ObjectExplorerExpandInfo> {
		return Promise.resolve(undefined);
	}

	public closeSession(closeSessionInfo: data.ObjectExplorerCloseSessionInfo): Thenable<data.ObjectExplorerCloseSessionResponse> {
		return Promise.resolve(undefined);
	}
}