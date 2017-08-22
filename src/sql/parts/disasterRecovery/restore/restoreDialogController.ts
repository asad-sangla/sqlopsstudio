/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IDisasterRecoveryService, IRestoreDialogController } from 'sql/parts/disasterRecovery/common/interfaces';
import { RestoreDialog } from 'sql/parts/disasterRecovery/restore/restoreDialog';
import { MssqlRestoreInfo } from 'sql/parts/disasterRecovery/restore/mssqlRestoreInfo';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import * as data from 'data';

export class RestoreDialogController implements IRestoreDialogController {
	_serviceBrand: any;

	private _restoreDialog: RestoreDialog;
	private _ownerUri: string;
	private _sessionId: string;
	private readonly _restoreFeature = 'Restore';

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IDisasterRecoveryService private _disasterRecoveryService: IDisasterRecoveryService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService
	) {
	}

	private handleOnRestore(): void {
		this._disasterRecoveryService.restore(this._ownerUri, this.setRestoreOption());
		this._restoreDialog.close();
	}

	private handleOnValidateFile(): void {
		this._disasterRecoveryService.getRestorePlan(this._ownerUri, this.setRestoreOption()).then(restorePlanResponse => {
			this._sessionId = restorePlanResponse.sessionId;

			if (restorePlanResponse.canRestore) {
				this._restoreDialog.enableRestoreButton(true);
			} else {
				this._restoreDialog.enableRestoreButton(false);
			}

			if (restorePlanResponse.errorMessage) {
				this._restoreDialog.onValidateResponseFail(restorePlanResponse.errorMessage);
			} else {
				this._restoreDialog.removeErrorMessage();
				this._restoreDialog.viewModel.onRestorePlanResponse(restorePlanResponse);
			}
		}, error => {
			this._restoreDialog.showError(error);
		});
	}

	private getRestoreConfigInfo(): void {
		this._disasterRecoveryService.getRestoreConfigInfo(this._ownerUri).then(restoreConfigInfo => {
			this._restoreDialog.viewModel.updateOptionWithConfigInfo(restoreConfigInfo.configInfo);
		}, error => {
			this._restoreDialog.showError(error);
		});
	}

	private setRestoreOption(): data.RestoreInfo {
		let restoreInfo = new MssqlRestoreInfo();

		if (this._sessionId) {
			restoreInfo.sessionId = this._sessionId;
		}

		restoreInfo.backupFilePaths = this._restoreDialog.viewModel.filePath;
		// todo: Need to change restoreInfo.readHeaderFromMedia when implement restore from database
		restoreInfo.readHeaderFromMedia = this._restoreDialog.viewModel.readHeaderFromMedia;
		restoreInfo.selectedBackupSets = this._restoreDialog.viewModel.selectedBackupSets;

		if (this._restoreDialog.viewModel.sourceDatabaseName) {
			restoreInfo.sourceDatabaseName = this._restoreDialog.viewModel.sourceDatabaseName;
		}
		if (this._restoreDialog.viewModel.targetDatabaseName) {
			restoreInfo.targetDatabaseName = this._restoreDialog.viewModel.targetDatabaseName;
		}

		// Set other restore options
		this._restoreDialog.viewModel.getRestoreAdvancedOptions(restoreInfo.options);

		return restoreInfo;
	}

	private getRestoreOption(): data.ServiceOption[] {
		let options: data.ServiceOption[] = [];
		let providerId: string = this._connectionService.getProviderIdFromUri(this._ownerUri);
		let providerCapabilities = this._capabilitiesService.getCapabilities().find(c => c.providerName === providerId);

		if (providerCapabilities) {
			let restoreMetadataProvider = providerCapabilities.features.find(f => f.featureName === this._restoreFeature);
			if (restoreMetadataProvider) {
				options = restoreMetadataProvider.optionsMetadata;
			}
		}
		return options;
	}

	public showDialog(connection: IConnectionProfile): TPromise<void> {
		return new TPromise<void>((resolve, reject) => {
			let result: void;
			this._connectionService.connectIfNotConnected(connection).then(ownerUri => {
				this._ownerUri = ownerUri;

				this._sessionId = null;
				if (!this._restoreDialog) {
					this._restoreDialog = this._instantiationService.createInstance(RestoreDialog, this.getRestoreOption());
					this._restoreDialog.onCancel(() => { });
					this._restoreDialog.onRestore(() => this.handleOnRestore());
					this._restoreDialog.onValidate(() => this.handleOnValidateFile());
					this._restoreDialog.render();
				}

				this._restoreDialog.viewModel.resetRestoreOptions();
				this.getRestoreConfigInfo();
				this._restoreDialog.open(connection.serverName, connection.databaseName);
				resolve(result);
			}, error => {
				reject(error);
			});
		});
	}
}
