/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import { MenuItem } from 'primeng/primeng';
import data = require('data');
import { ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';


declare let AngularCore;
export const BACKUP_SELECTOR: string = 'backup-component';

@AngularCore.Component({
	selector: BACKUP_SELECTOR,
	templateUrl: require.toUrl('sql/parts/disasterRecovery/backup/backup.component.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class BackupComponent {
	public connection: ConnectionManagementInfo;

	constructor(
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
		let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
		this.connection = dashboardParameters.connection;
	}

}
