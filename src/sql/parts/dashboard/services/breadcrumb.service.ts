/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Injectable, forwardRef, Inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { DashboardServiceInterface } from './dashboardServiceInterface.service';
import { MenuItem, IBreadcrumbService } from 'sql/base/browser/ui/breadcrumb/interfaces';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';

export enum BreadcrumbClass {
	DatabasePage,
	ServerPage
};

@Injectable()
export class BreadcrumbService implements IBreadcrumbService, OnDestroy {
	public breadcrumbItem: Subject<MenuItem[]>;
	private itemBreadcrums: MenuItem[];
	private _disposables: IDisposable[] = [];
	private _currentPage: BreadcrumbClass;

	constructor( @Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) {
		_bootstrap.onUpdatePage(() => {
			this.setBreadcrumbs(this._currentPage);
		});
		this.breadcrumbItem = new Subject<MenuItem[]>();
	}

	public setBreadcrumbs(page: BreadcrumbClass) {
		this._currentPage = page;
		this.itemBreadcrums = [];
		let refList: MenuItem[] = this.getBreadcrumbsLink(page);
		this.breadcrumbItem.next(refList);
	}

	private getBreadcrumbsLink(page: BreadcrumbClass): MenuItem[] {
		this.itemBreadcrums = [];
		let profile = this._bootstrap.connectionManagementService.connectionInfo.connectionProfile;

		switch (page) {
			case BreadcrumbClass.DatabasePage:
				this.itemBreadcrums.push({ label: profile.serverName, routerLink: ['server-dashboard'], icon: 'server-page' });
				this.itemBreadcrums.push({
					label: profile.databaseName ? profile.databaseName : 'database-name',
					routerLink: ['database-dashboard'],
					icon: 'database'
				});
				break;
			case BreadcrumbClass.ServerPage:
				this.itemBreadcrums.push({ label: profile.serverName, routerLink: ['server-dashboard'], icon: 'server-page' });
				break;
			default:
				this.itemBreadcrums = [];
		}
		return this.itemBreadcrums;
	}

	ngOnDestroy() {
		this._disposables = dispose(this._disposables);
	}
}