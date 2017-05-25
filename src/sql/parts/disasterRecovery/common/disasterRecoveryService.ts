/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { BackupInput } from 'sql/parts/disasterRecovery/backup/backupInput';
import data = require('data');

export const SERVICE_ID = 'disasterRecoveryService';

export const IDisasterRecoveryService = createDecorator<IDisasterRecoveryService>(SERVICE_ID);

export interface IDisasterRecoveryService {
	_serviceBrand: any;

    getBackupConfigInfo(connectionUri: string): Thenable<data.BackupConfigInfo>;

	/**
	 * Backup a data source using the provided connection
	 */
	backup(connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse>;

	/**
	 * Show backup wizard
	 */
	showBackupWizard(uri: string, connection: ConnectionManagementInfo): Promise<any>;

	/**
	 * Register a disaster recovery provider
	 */
	registerProvider(providerId: string, provider: data.DisasterRecoveryProvider): void;
}

export class DisasterRecoveryService implements IDisasterRecoveryService {

	public _serviceBrand: any;

	private _providers: { [handle: string]: data.DisasterRecoveryProvider; } = Object.create(null);

	constructor(@IConnectionManagementService private _connectionService: IConnectionManagementService,
				@IInstantiationService private _instantiationService: IInstantiationService,
				@IWorkbenchEditorService private _editorService: IWorkbenchEditorService) {
	}

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

	public showBackupWizard(uri: string, connection: ConnectionManagementInfo): Promise<any> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			let input: BackupInput = self._instantiationService ? self._instantiationService.createInstance(BackupInput, uri, connection) : undefined;
			self._editorService.openEditor(input, { pinned: true }, false);
			resolve(true);
		});
	}

	/**
	 * Backup a data source using the provided connection
	 */
	public backup(connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse> {
		let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				return provider.backup(connectionUri, backupInfo);
			}
		}

		return Promise.resolve(undefined);
	}

	/**
	 * Register a disaster recovery provider
	 */
	public registerProvider(providerId: string, provider: data.DisasterRecoveryProvider): void {
		this._providers[providerId] = provider;
	}

}
