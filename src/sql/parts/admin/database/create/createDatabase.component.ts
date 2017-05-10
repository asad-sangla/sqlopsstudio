/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { TaskDialogComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { ITaskDialogComponent } from 'sql/parts/tasks/common/tasks';

import data = require('data');

declare let AngularCore;

export const CREATEDATABASE_SELECTOR: string = 'createdatabase-component';

@AngularCore.Component({
	selector: CREATEDATABASE_SELECTOR,
	templateUrl: require.toUrl('sql/parts/admin/database/create/createDatabase.component.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class CreateDatabaseComponent implements ITaskDialogComponent {

    private _adminService: IAdminService;

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

    public databaseFiles: data.DatabaseFile[] = [];

	constructor(
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        this._adminService = this._bootstrapService.adminService;
	}

	ngOnInit() {
    }

    public getDatabaseInfo(): data.DatabaseInfo {
        return undefined;
    }

	public onOk(): void {

       this._adminService.createDatabase(this.ownerUri, this.getDatabaseInfo());

    }

	public onGenerateScript(): void {
    }

	public onCancel(): void {
    }

    public injectBootstapper(parameters: TaskDialogComponentParams ): void {
        let self = this;
        this._adminService.getDefaultDatabaseInfo(parameters.ownerUri).then(dbInfo => {
           let databaseFilesCount = dbInfo.options['databaseFilesCount'];
           for (let i = 0; i < databaseFilesCount; ++i) {
                let filename = dbInfo.options['databaseFiles.' + i + '.name'];
                let physicalFilename = dbInfo.options['databaseFiles.' + i + '.physicalName'];

                self.databaseFiles[i] = {
                    logicalName: filename,
                    fileType: 'Rows data',
                    filegroup: 'PRIMARY',
                    initialSize: '8',
                    maxSize: '64MB',
                    path: physicalFilename
                };
           }
           self.changeDetectorRef.detectChanges();
		});
    }
}
