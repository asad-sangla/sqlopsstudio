/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { BackupDialog } from 'sql/parts/disasterRecovery/backup/backupDialog';
import { IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IPartService } from 'vs/workbench/services/part/common/partService';

export class DisasterRecoveryUiService implements IDisasterRecoveryUiService {
	public _serviceBrand: any;
	private _backupDialog: BackupDialog;

	constructor( @IInstantiationService private _instantiationService: IInstantiationService,
		@IPartService private _partService: IPartService) {
	}

	public showBackup(uri: string, connection: ConnectionManagementInfo): Promise<any> {
		let self = this;
		return new Promise<void>((resolve, reject) => {
			self.showBackupDialog(uri, connection).then(() => {
				resolve();
			}, error => {
				reject();
			});
		});
	}

	public showBackupDialog(uri: string, connection: ConnectionManagementInfo): TPromise<void> {
		let self = this;
		if (!self._backupDialog) {
			self._backupDialog = self._instantiationService ? self._instantiationService.createInstance(BackupDialog) : undefined;
			self._backupDialog.render();
		}

		return new TPromise<void>(() => {
			self._backupDialog.open(uri, connection);
		});
	}

	public closeBackup() {
		let self = this;
		if (self._backupDialog) {
			self._backupDialog.close();
		}
	}

}
