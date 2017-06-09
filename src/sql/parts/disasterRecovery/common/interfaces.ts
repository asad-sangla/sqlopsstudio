/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import data = require('data');

export const SERVICE_ID = 'disasterRecoveryService';
export const UI_SERVICE_ID = 'disasterRecoveryUiService';

export const IDisasterRecoveryUiService = createDecorator<IDisasterRecoveryUiService>(UI_SERVICE_ID);

export interface IDisasterRecoveryUiService {
	_serviceBrand: any;

	/**
	 * Show backup wizard
	 */
	showBackup(uri: string, connection: ConnectionManagementInfo): Promise<any>;
}

export const IDisasterRecoveryService = createDecorator<IDisasterRecoveryService>(SERVICE_ID);

export interface IDisasterRecoveryService {
	_serviceBrand: any;

    getBackupConfigInfo(connectionUri: string): Thenable<data.BackupConfigInfo>;

	/**
	 * Backup a data source using the provided connection
	 */
	backup(connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse>;


	/**
	 * Register a disaster recovery provider
	 */
	registerProvider(providerId: string, provider: data.DisasterRecoveryProvider): void;
}
