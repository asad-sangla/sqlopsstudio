/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/primeng';
import { ChangeDetectorRef, ElementRef, Component, forwardRef, Inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { TaskDialogComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { ITaskDialogComponent } from 'sql/parts/tasks/common/tasks';

import data = require('data');

export const CREATEDATABASE_SELECTOR: string = 'createdatabase-component';

export interface DatabaseFile {
    logicalName: string;
    fileType: string;
    filegroup: string;
    initialSize: string;
    autogrow: string;
    path: string;
}

@Component({
	selector: CREATEDATABASE_SELECTOR,
	templateUrl: require.toUrl('sql/parts/admin/database/create/createDatabase.component.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class CreateDatabaseComponent implements ITaskDialogComponent {

    private _adminService: IAdminService;

    public formSubmitted: boolean = false;

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

    public databaseFiles: DatabaseFile[] = [];

	constructor(
        @Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
        @Inject(forwardRef(() => ChangeDetectorRef)) private _changeDetectorRef: ChangeDetectorRef,
        @Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        this._adminService = this._bootstrapService.adminService;
	}

	ngOnInit() {
    }

    private getDatabaseInfo(form: NgForm): data.DatabaseInfo {
        return <data.DatabaseInfo>{
            options: {
                name: form.value.databaseName,
                owner: form.value.databaseOwner
            }
        };
    }

    public onSubmit(form: NgForm): void {
        this._adminService.createDatabase(this.ownerUri, this.getDatabaseInfo(form));
        this.formSubmitted = true;
        this._changeDetectorRef.detectChanges();
    }

	public onOk(): void { }

	public onGenerateScript(): void { }

	public onCancel(): void { }

    public onSelectOwner(): void { }

    public injectBootstapper(parameters: TaskDialogComponentParams ): void {
        let self = this;
        this.ownerUri = parameters.ownerUri;
        this._adminService.getDefaultDatabaseInfo(this.ownerUri).then(dbInfo => {
           let databaseFilesCount = dbInfo.options['databaseFilesCount'];
           for (let i = 0; i < databaseFilesCount; ++i) {
                self.databaseFiles[i] = {
                    logicalName: dbInfo.options['databaseFiles.' + i + '.name'],
                    fileType:  dbInfo.options['databaseFiles.' + i + '.databaseFileType'],
                    filegroup:  dbInfo.options['databaseFiles.' + i + '.fileGroup'],
                    initialSize: dbInfo.options['databaseFiles.' + i + '.initialSize'],
                    autogrow: dbInfo.options['databaseFiles.' + i + '.autogrowth'],
                    path: dbInfo.options['databaseFiles.' + i + '.folder']
                };
           }
           self._changeDetectorRef.detectChanges();
		});
    }
}
