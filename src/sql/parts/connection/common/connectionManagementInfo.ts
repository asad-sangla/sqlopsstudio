/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import * as data from 'data';
import { StopWatch } from 'vs/base/common/stopwatch';

/**
 * Information for a document's connection. Exported for testing purposes.
 */
export class ConnectionManagementInfo {
	/**
	 * Connection GUID returned from the service host
	 */
	public connectionId: string;


	public providerId: string;

	/**
	 * Credentials used to connect
	 */
	public connectionProfile: ConnectionProfile;

	/**
	 * Callback for when a connection notification is received.
	 */
	public connectHandler: (result: boolean, error?: any) => void;

	/**
	 * Information about the SQL Server instance.
	 */
	//public serverInfo: ConnectionContracts.ServerInfo;

	/**
	 * Timer for tracking extension connection time.
	 */
	public extensionTimer: StopWatch;

	/**
	 * Timer for tracking service connection time.
	 */
	public serviceTimer: StopWatch;

	/**
	 * Timer for tracking intelliSense activation time.
	 */
	public intelliSenseTimer: StopWatch;

	/**
	 * Whether the connection is in the process of connecting.
	 */
	public connecting: boolean;

	/**
	 * Information about the connected server.
	 */
	serverInfo: data.ServerInfo;

	/**
	 * Owner uri assigned to the connection
	 */
	public ownerUri: string;
}