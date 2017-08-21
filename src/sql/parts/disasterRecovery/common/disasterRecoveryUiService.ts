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
	private _backupDialog: BackupDialog | OptionsDialog;
	private _optionsMap: { [providerName: string]: data.FeatureMetadataProvider } = {};
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
		let backupOptions = undefined;
		let capabilitiesList = this._capabilitiesService.getCapabilities();
		capabilitiesList.forEach(providerCapabilities => {
			let backupOptions = providerCapabilities.features.find(feature => feature.featureName === 'backup');
			if (backupOptions) {
				this._optionsMap[providerCapabilities.providerName] = backupOptions;
			}
		});
		let providerOptions = self._optionsMap[connection.providerName];
		if (providerOptions && providerOptions.optionsMetadata) {
			backupOptions = providerOptions.optionsMetadata;
			self._backupDialog = self._instantiationService ? self._instantiationService.createInstance(
				OptionsDialog, 'Backup database - ' + connection.serverName + ':' + connection.databaseName, undefined) : undefined;
		}
		else {
			self._backupDialog = self._instantiationService ? self._instantiationService.createInstance(BackupDialog) : undefined;
		}
		self._backupDialog.render();

		return new TPromise<void>(() => {
			if (backupOptions) {
				let dialog = self._backupDialog as OptionsDialog;
				dialog.onOk(() => this.handleOptionDialogClosed());
				dialog.open(backupOptions, self._optionValues);
			} else {
				(self._backupDialog as BackupDialog).open(connection);
			}
		});
	}

	public closeBackup() {
		let self = this;
		if (self._backupDialog) {
			self._backupDialog.close();
		}
	}

	private handleOptionDialogClosed() {
		this._disasterRecoveryService.backup(this._connectionUri, this._optionValues, TaskExecutionMode.executeAndScript);
		this._backupDialog = undefined;
	}

}
