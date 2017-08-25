/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IDisasterRecoveryService, IRestoreDialogController, TaskExecutionMode } from 'sql/parts/disasterRecovery/common/interfaces';
import { OptionsDialog } from 'sql/parts/common/modal/optionsDialog';
import { RestoreDialog } from 'sql/parts/disasterRecovery/restore/restoreDialog';
import { MssqlRestoreInfo } from 'sql/parts/disasterRecovery/restore/mssqlRestoreInfo';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import * as data from 'data';
import * as ConnectionConstants from 'sql/parts/connection/common/constants';

export class RestoreDialogController implements IRestoreDialogController {
	_serviceBrand: any;

	private _restoreDialogs: { [provider: string]: RestoreDialog | OptionsDialog } = {};
	private _currentProvider: string;
	private _ownerUri: string;
	private _sessionId: string;
	private readonly _restoreFeature = 'Restore';
	private _optionValues: { [optionName: string]: any } = {};

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IDisasterRecoveryService private _disasterRecoveryService: IDisasterRecoveryService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService
	) {
	}

	private handleOnRestore(isScriptOnly: boolean = false): void {
		let restoreOption = this.setRestoreOption();
		if (isScriptOnly) {
			restoreOption.taskExecutionMode = TaskExecutionMode.script;
		} else {
			restoreOption.taskExecutionMode = TaskExecutionMode.executeAndScript;
		}

		this._disasterRecoveryService.restore(this._ownerUri, restoreOption);
		let restoreDialog = this._restoreDialogs[this._currentProvider];
		restoreDialog.close();
	}

	private handleMssqlOnValidateFile(): void {
		let restoreDialog = this._restoreDialogs[this._currentProvider] as RestoreDialog;
		this._disasterRecoveryService.getRestorePlan(this._ownerUri, this.setRestoreOption()).then(restorePlanResponse => {
			this._sessionId = restorePlanResponse.sessionId;

			if (restorePlanResponse.canRestore) {
				restoreDialog.enableRestoreButton(true);
			} else {
				restoreDialog.enableRestoreButton(false);
			}

			if (restorePlanResponse.errorMessage) {
				restoreDialog.onValidateResponseFail(restorePlanResponse.errorMessage);
			} else {
				restoreDialog.removeErrorMessage();
				restoreDialog.viewModel.onRestorePlanResponse(restorePlanResponse);
			}
		}, error => {
			restoreDialog.showError(error);
		});
	}

	private getMssqlRestoreConfigInfo(): void {
		let restoreDialog = this._restoreDialogs[this._currentProvider] as RestoreDialog;
		this._disasterRecoveryService.getRestoreConfigInfo(this._ownerUri).then(restoreConfigInfo => {
			restoreDialog.viewModel.updateOptionWithConfigInfo(restoreConfigInfo.configInfo);
		}, error => {
			restoreDialog.showError(error);
		});
	}

	private setRestoreOption(): data.RestoreInfo {
		let restoreInfo = undefined;

		let providerId: string = this.getCurrentProviderId();
		if (providerId === ConnectionConstants.mssqlProviderName) {
			restoreInfo = new MssqlRestoreInfo();

			if (this._sessionId) {
				restoreInfo.sessionId = this._sessionId;
			}

			let restoreDialog = this._restoreDialogs[providerId] as RestoreDialog;
			restoreInfo.backupFilePaths = restoreDialog.viewModel.filePath;
			// todo: Need to change restoreInfo.readHeaderFromMedia when implement restore from database
			restoreInfo.readHeaderFromMedia = restoreDialog.viewModel.readHeaderFromMedia;
			restoreInfo.selectedBackupSets = restoreDialog.viewModel.selectedBackupSets;

			if (restoreDialog.viewModel.sourceDatabaseName) {
				restoreInfo.sourceDatabaseName = restoreDialog.viewModel.sourceDatabaseName;
			}
			if (restoreDialog.viewModel.targetDatabaseName) {
				restoreInfo.targetDatabaseName = restoreDialog.viewModel.targetDatabaseName;
			}

			// Set other restore options
			restoreDialog.viewModel.getRestoreAdvancedOptions(restoreInfo.options);
		} else {
			restoreInfo = { options: this._optionValues };
		}

		return restoreInfo;
	}

	private getRestoreOption(): data.ServiceOption[] {
		let options: data.ServiceOption[] = [];
		let providerId: string = this.getCurrentProviderId();
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

				this._currentProvider = this.getCurrentProviderId();
				if (!this._restoreDialogs[this._currentProvider]) {
					let newRestoreDialog: RestoreDialog | OptionsDialog = undefined;
					if (this._currentProvider === ConnectionConstants.mssqlProviderName) {
						newRestoreDialog = this._instantiationService.createInstance(RestoreDialog, this.getRestoreOption());
						newRestoreDialog.onCancel(() => { });
						newRestoreDialog.onRestore((isScriptOnly) => this.handleOnRestore(isScriptOnly));
						newRestoreDialog.onValidate(() => this.handleMssqlOnValidateFile());
					} else {
						newRestoreDialog= this._instantiationService.createInstance(
							OptionsDialog, 'Restore database - ' + connection.serverName + ':' + connection.databaseName, undefined);
							newRestoreDialog.onOk(() => this.handleOnRestore());
					}
					newRestoreDialog.render();
					this._restoreDialogs[this._currentProvider] = newRestoreDialog;
				}

				if (this._currentProvider === ConnectionConstants.mssqlProviderName) {
					let restoreDialog = this._restoreDialogs[this._currentProvider] as RestoreDialog;
					restoreDialog.viewModel.resetRestoreOptions(connection.databaseName);
					this.getMssqlRestoreConfigInfo();
					restoreDialog.open(connection.serverName, this._ownerUri);
				} else {
					let restoreDialog = this._restoreDialogs[this._currentProvider] as OptionsDialog;
					restoreDialog.open(this.getRestoreOption(), this._optionValues);
				}

				resolve(result);
			}, error => {
				reject(error);
			});
		});
	}

	private getCurrentProviderId(): string {
		return this._connectionService.getProviderIdFromUri(this._ownerUri);
	}
}
