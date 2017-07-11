/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IRestoreDialogService } from 'sql/parts/disasterRecovery/common/interfaces';
import { RestoreDialog } from 'sql/parts/disasterRecovery/restore/restoreDialog';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

export class RestoreDialogService implements IRestoreDialogService {
	_serviceBrand: any;

	private _restoreDialog: RestoreDialog;
	private _ownerUri: string;

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	private handleOnRestore(): void {
		// todo: need to integrate with the restore service
		this._restoreDialog.close();
	}

	private handleOnValidateFile(): void {
		// todo: need to integrate with the restore service
	}

	public showDialog(uri: string, connection: ConnectionManagementInfo): TPromise<void> {
		this._ownerUri = uri;
		if (!this._restoreDialog) {
			this._restoreDialog = this._instantiationService.createInstance(RestoreDialog);
			this._restoreDialog.onCancel(() => { });
			this._restoreDialog.onRestore(() => this.handleOnRestore());
			this._restoreDialog.onValidate(() => this.handleOnValidateFile());
			this._restoreDialog.render();
		}

		return new TPromise<void>(() => {
			this._restoreDialog.open(connection.connectionProfile.serverName);
		});
	}
}
