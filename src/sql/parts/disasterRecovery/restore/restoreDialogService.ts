/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IDisasterRecoveryService, IRestoreDialogService } from 'sql/parts/disasterRecovery/common/interfaces';
import { RestoreDialog } from 'sql/parts/disasterRecovery/restore/restoreDialog';
import { MssqlRestoreInfo } from 'sql/parts/disasterRecovery/restore/mssqlRestoreInfo';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

export class RestoreDialogService implements IRestoreDialogService {
	_serviceBrand: any;

	private _restoreDialog: RestoreDialog;
	private _ownerUri: string;
	private _sessionId: string;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IDisasterRecoveryService private _disasterRecoveryService: IDisasterRecoveryService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService
	) {
	}

	private handleOnRestore(): void {
		let restoreInfo = new MssqlRestoreInfo();
		if (this._sessionId) {
			restoreInfo.sessionId = this._sessionId;
		}
		restoreInfo.backupFilePaths = this._restoreDialog.filePath;
		restoreInfo.targetDatabaseName = this._restoreDialog.databaseName;
		restoreInfo.relocateDbFiles = false;

		this._disasterRecoveryService.restore(this._ownerUri, restoreInfo);
		this._restoreDialog.close();
	}

	private handleOnValidateFile(): void {

		let restoreInfo = new MssqlRestoreInfo();
		restoreInfo.backupFilePaths = this._restoreDialog.filePath;
		restoreInfo.targetDatabaseName = this._restoreDialog.databaseName;
		restoreInfo.relocateDbFiles = false;

		this._disasterRecoveryService.getRestorePlan(this._ownerUri, restoreInfo).then(restorePlanResponse => {
			// to do: will add dbFiles back when file info is implemented
			// let dbFiles: string[] = restorePlanResponse.dbFiles ? restorePlanResponse.dbFiles.map(x => x.restoreAsFileName) : [];
			this._sessionId = restorePlanResponse.sessionId;
			this._restoreDialog.onValidateResponse(restorePlanResponse.canRestore, restorePlanResponse.errorMessage,
				restorePlanResponse.databaseNamesFromBackupSets, restorePlanResponse.backupSetsToRestore);
		}, error => {
			this._restoreDialog.showError(error);
		});
	}

	public showDialog(connection: IConnectionProfile): TPromise<void> {
		this._ownerUri = this._connectionService.getConnectionId(connection);
		this._sessionId = null;
		if (!this._restoreDialog) {
			this._restoreDialog = this._instantiationService.createInstance(RestoreDialog);
			this._restoreDialog.onCancel(() => { });
			this._restoreDialog.onRestore(() => this.handleOnRestore());
			this._restoreDialog.onValidate(() => this.handleOnValidateFile());
			this._restoreDialog.render();
		}

		return new TPromise<void>(() => {
			this._restoreDialog.open(connection.serverName);
		});
	}
}
