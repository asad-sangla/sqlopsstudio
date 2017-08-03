/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Injectable, forwardRef, Inject } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { DashboardServiceInterface } from './dashboardServiceInterface.service';
import { MenuItem } from 'sql/parts/dashboard/common/breadcrumb.component';

export enum BreadcrumbClass {
	DatabasePage = 0,
	ServerPage = 1
};

@Injectable()
export class BreadcrumbService {
	public breadcrumbItem: Subject<MenuItem[]>;
	private itemBreadcrums: MenuItem[];
	private _connection: ConnectionManagementInfo;

	constructor(@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) {
		let self = this;
		self._bootstrap.connectionManagementService.onDidChangeConnection((e: ConnectionManagementInfo) => {
			self._connection = e;
		});
		self.breadcrumbItem = new Subject<MenuItem[]>();
	}

	public setBreadcrumbs(page: BreadcrumbClass) {
		let self = this;
		self._connection = self._bootstrap.connectionManagementService.connectionInfo;
		self._setBreadcrumbs(page);
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
				this.itemBreadcrums.push({ label: this._connection.connectionProfile.serverName, routerLink: ['server-dashboard'], icon: 'server-page' });
				this.itemBreadcrums.push({
					label: this._connection.connectionProfile.databaseName ? this._connection.connectionProfile.databaseName : 'database-name',
					routerLink: ['database-dashboard'],
					icon: 'database'
				});
				break;
			case BreadcrumbClass.ServerPage:
				this.itemBreadcrums.push({ label: this._connection.connectionProfile.serverName, routerLink: ['server-dashboard'], icon: 'server-page' });
				break;
			default:
				this.itemBreadcrums = [];
		}
		return this.itemBreadcrums;
	}
}