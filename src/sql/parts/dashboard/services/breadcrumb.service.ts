/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Injectable, forwardRef, Inject } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

import { MenuItem } from 'primeng/primeng';
import { DashboardServiceInterface } from './dashboardServiceInterface.service';

export enum BreadcrumbClass {
	DatabasePage = 0,
	ServerPage = 1
};

@Injectable()
export class BreadcrumbService {
    public breadcrumbItem: Subject<MenuItem[]>;
    private itemBreadcrums: MenuItem[];
    private _connection: ConnectionManagementInfo;
    private _connectionWaitPromise: Promise<void>;

    constructor(@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) {
        let self = this;
        self._connectionWaitPromise = new Promise<void>((resolve) => {
            self._bootstrap.connectionInfo.then((data) => {
                self._connection = data;
                resolve();
            });
        });
        self._bootstrap.onConnectionChange((e: ConnectionManagementInfo) => {
            self._connection = e;
        });
        self.breadcrumbItem = new Subject<MenuItem[]>();
    }

    public setBreadcrumbs(page: BreadcrumbClass) {
        let self = this;
        if (self._connection) {
            self._setBreadcrumbs(page);
        } else {
            self._connectionWaitPromise.then(() => {
                self._setBreadcrumbs(page);
            });
        }
    }

    private _setBreadcrumbs(page: BreadcrumbClass) {
        this.itemBreadcrums = [];
        let refList: MenuItem[] = this.getBreadcrumbsLink(page);
        this.breadcrumbItem.next(refList);
    }

    private getBreadcrumbsLink(page: BreadcrumbClass): MenuItem[] {
        this.itemBreadcrums = [];

        switch (page) {
            case BreadcrumbClass.DatabasePage:
                this.itemBreadcrums.push({ label: this._connection.connectionProfile.serverName, routerLink: ['server-dashboard'] });
                this.itemBreadcrums.push({
                    label: this._connection.connectionProfile.databaseName ? this._connection.connectionProfile.databaseName : 'database-name',
                    routerLink: ['database-dashboard']
                });
                break;
            case BreadcrumbClass.ServerPage:
                this.itemBreadcrums.push({ label: this._connection.connectionProfile.serverName, routerLink: ['server-dashboard'] });
                break;
            default:
                this.itemBreadcrums = [];
        }
        return this.itemBreadcrums;
    }
}