/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import 'vs/css!sql/media/font-awesome-4.7.0/css/font-awesome';

import { ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

export const TASKDIALOG_SELECTOR: string = 'taskdialog-component';

@AngularCore.Component({
	selector: TASKDIALOG_SELECTOR,
	templateUrl: require.toUrl('sql/parts/tasks/dialog/taskDialog.component.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class TaskDialogComponent {

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

	constructor(
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	public onActivate(component: any) {

	}

	public onDeactivate(component: any) {

	}
}
