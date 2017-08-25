/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { OptionsDialog } from 'sql/parts/common/modal/optionsDialog';
import { BackupDialog } from 'sql/parts/disasterRecovery/backup/backupDialog';
import { IDisasterRecoveryService, IDisasterRecoveryUiService, TaskExecutionMode } from 'sql/parts/disasterRecovery/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import ConnectionUtils = require('sql/parts/connection/common/utils');
import data = require('data');

export class DisasterRecoveryUiService implements IDisasterRecoveryUiService {
	public _serviceBrand: any;
	private _backupDialogs: { [providerName: string]: BackupDialog | OptionsDialog } = {};
	private _currentProvider: string;
	private _optionsMap: { [providerName: string]: data.ServiceOption[] } = {};
	private _optionValues: { [optionName: string]: any } = {};
	private _connectionUri: string;

	constructor( @IInstantiationService private _instantiationService: IInstantiationService,
		@IPartService private _partService: IPartService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IDisasterRecoveryService private _disasterRecoveryService: IDisasterRecoveryService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService) {
	}

	public showBackup(connection: IConnectionProfile): Promise<any> {
		let self = this;
		return new Promise<void>((resolve, reject) => {
			self.showBackupDialog(connection).then(() => {
				resolve();
			}, error => {
				reject();
			});
		});
	}

	public showBackupDialog(connection: IConnectionProfile): TPromise<void> {
		let self = this;
		self._connectionUri = ConnectionUtils.generateUri(connection);
		self._currentProvider = connection.providerName;
		let backupDialog = self._backupDialogs[self._currentProvider];
		if (!backupDialog) {
			let capabilitiesList = this._capabilitiesService.getCapabilities();
			capabilitiesList.forEach(providerCapabilities => {
				let backupFeature = providerCapabilities.features.find(feature => feature.featureName === 'backup');
				if (backupFeature && backupFeature.optionsMetadata) {
					this._optionsMap[providerCapabilities.providerName] = backupFeature.optionsMetadata;
				}
			});
			let backupOptions = self._optionsMap[self._currentProvider];
			if (backupOptions) {
				backupDialog = self._instantiationService ? self._instantiationService.createInstance(
					OptionsDialog, 'Backup database - ' + connection.serverName + ':' + connection.databaseName, undefined) : undefined;
				backupDialog.onOk(() => this.handleOptionDialogClosed());
			}
			else {
				backupDialog = self._instantiationService ? self._instantiationService.createInstance(BackupDialog) : undefined;
			}
			backupDialog.render();
			self._backupDialogs[self._currentProvider] = backupDialog;
		}

		let backupOptions = this._optionsMap[self._currentProvider];
		return new TPromise<void>(() => {
			if (backupOptions) {
				(backupDialog as OptionsDialog).open(backupOptions, self._optionValues);
			} else {
				(backupDialog as BackupDialog).open(connection);
			}
		});
	}

	public closeBackup() {
		let self = this;
		let backupDialog = self._backupDialogs[self._currentProvider];
		if (backupDialog) {
			backupDialog.close();
		}
	}

	private handleOptionDialogClosed() {
		this._disasterRecoveryService.backup(this._connectionUri, this._optionValues, TaskExecutionMode.executeAndScript);
	}

}
