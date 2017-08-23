/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';

import { ElementRef, Component, Inject, forwardRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

export const CREATELOGIN_SELECTOR: string = 'createlogin-component';

@Component({
	selector: CREATELOGIN_SELECTOR,
	templateUrl: require.toUrl('sql/parts/admin/security/createLogin.component.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class CreateLoginComponent {

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

	constructor(
        @Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
        @Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        let parameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);

	}
}
