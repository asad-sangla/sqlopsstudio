/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import Utils = require('./utils');
import * as data from 'data';

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
	public extensionTimer: Utils.Timer;

    /**
     * Timer for tracking service connection time.
     */
	public serviceTimer: Utils.Timer;

    /**
     * Timer for tracking intelliSense activation time.
     */
	public intelliSenseTimer: Utils.Timer;

    /**
     * Whether the connection is in the process of connecting.
     */
	public connecting: boolean;

    /**
     * Information about the connected server.
     */
	serverInfo: data.ServerInfo;
}