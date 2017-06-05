/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import 'vs/css!sql/media/font-awesome-4.7.0/css/font-awesome';


import { MenuItem } from 'primeng/primeng';
import { OnInit, Component, Inject, forwardRef, ElementRef, ChangeDetectorRef } from '@angular/core';

import { BreadcrumbService } from './services/breadcrumb.service';
import { DashboardServiceInterface } from './services/dashboardServiceInterface.service';

export const DASHBOARD_SELECTOR: string = 'dashboard-component';

@Component({
	selector: DASHBOARD_SELECTOR,
	templateUrl: require.toUrl('sql/parts/dashboard/dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DashboardComponent implements OnInit {
	private breadcrumbItems: MenuItem[];

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private _breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrapService: DashboardServiceInterface,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
		) {
			this.breadcrumbItems = [];
			this._bootstrapService.selector = this._el.nativeElement.tagName;
		}

	ngOnInit(): void {
		let self = this;
		self._breadcrumbService.breadcrumbItem.subscribe((val: MenuItem[]) => {
			if (val) {
				self.breadcrumbItems = val;
				self._changeRef.detectChanges();
			}
		});
	}

}
