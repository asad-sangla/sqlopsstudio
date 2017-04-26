/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

export const CREATEDATABASE_SELECTOR: string = 'createdatabase-component';

@AngularCore.Component({
	selector: CREATEDATABASE_SELECTOR,
	templateUrl: require.toUrl('sql/parts/admin/database/create/createDatabase.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class CreateDatabaseComponent {

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

	constructor(
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        let parameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);

	}
}
