/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');
import { IDisasterRecoveryService } from './interfaces';

export class DisasterRecoveryService implements IDisasterRecoveryService {

	public _serviceBrand: any;
	private _providers: { [handle: string]: data.DisasterRecoveryProvider; } = Object.create(null);

	constructor( @IConnectionManagementService private _connectionService: IConnectionManagementService) {
	}

	/**
	 * Get database metadata needed to populate backup UI
	 */
	public getBackupConfigInfo(connectionUri: string): Thenable<data.BackupConfigInfo> {
		let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				return provider.getBackupConfigInfo(connectionUri);
			}
		}
		return Promise.resolve(undefined);
	}

	/**
	 * Backup a data source using the provided connection
	 */
	public backup(connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse> {
		return new Promise<data.BackupResponse>((resolve, reject) => {
			let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
			if (providerId) {
				let provider = this._providers[providerId];
				if (provider) {
					provider.backup(connectionUri, backupInfo).then(result => {
						resolve(result);
					}, error => {
						reject(error);
					});
				} else {
					reject('provider is undefined');
				}
			} else {
				reject('provider id is undefined');
			}
		});
	}

	/**
	 * Restore a data source using a backup file or database
	 */
	restore(connectionUri: string, restoreInfo: data.RestoreInfo): Thenable<data.RestoreResponse> {
		return new Promise<data.RestoreResponse>((resolve, reject) => {
			let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
			if (providerId) {
				let provider = this._providers[providerId];
				if (provider) {
					provider.restore(connectionUri, restoreInfo).then(result => {
						resolve(result);
					}, error => {
						reject(error);
					});
				} else {
					reject('provider is undefined');
				}
			} else {
				reject('provider id is undefined');
			}
		});
	}

	/**
	 * Gets restore plan to do the restore operation on a database
	 */
	getRestorePlan(connectionUri: string, restoreInfo: data.RestoreInfo): Thenable<data.RestorePlanResponse> {
		return new Promise<data.RestorePlanResponse>((resolve, reject) => {
			let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
			if (providerId) {
				let provider = this._providers[providerId];
				if (provider) {
					provider.getRestorePlan(connectionUri, restoreInfo).then(result => {
						resolve(result);
					}, error => {
						reject(error);
					});
				} else {
					reject('provider is undefined');

				}
			} else {
				reject('provider id is undefined');
			}
		});
	}

	/**
	 * Register a disaster recovery provider
	 */
	public registerProvider(providerId: string, provider: data.DisasterRecoveryProvider): void {
		this._providers[providerId] = provider;
	}
}
