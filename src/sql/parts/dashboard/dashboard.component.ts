/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { MenuItem } from 'primeng/primeng';
import { OnInit, Component, Inject, forwardRef, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { BreadcrumbService } from './services/breadcrumb.service';
import { DashboardServiceInterface } from './services/dashboardServiceInterface.service';

import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IDisposable } from 'vs/base/common/lifecycle';
import * as themeColors from 'vs/workbench/common/theme';

export const DASHBOARD_SELECTOR: string = 'dashboard-component';

@Component({
	selector: DASHBOARD_SELECTOR,
	templateUrl: require.toUrl('sql/parts/dashboard/dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DashboardComponent implements OnInit, OnDestroy {
	private breadcrumbItems: MenuItem[];
	private _subs: Array<IDisposable> = new Array();

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private _breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrapService: DashboardServiceInterface,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
		) {
			this.breadcrumbItems = [];
		}

	ngOnInit() {
		let self = this;
		self._subs.push(toDisposableSubscription(self._breadcrumbService.breadcrumbItem.subscribe((val: MenuItem[]) => {
			if (val) {
				self.breadcrumbItems = val;
				self._changeRef.detectChanges();
			}
		})));
		self._subs.push(self._bootstrapService.themeService.onDidColorThemeChange((e) => {
			self.updateTheme(e);
		}));
		self.updateTheme(self._bootstrapService.themeService.getColorTheme());
	}

	ngOnDestroy() {
		this._subs.forEach((value) => {
			value.dispose();
		});
	}

	private updateTheme(theme: IColorTheme): void {
		let el = <HTMLElement> this._el.nativeElement;
		$(el).find('#header')[0].style.borderBottomColor = theme.getColor(themeColors.SIDE_BAR_BACKGROUND, true).toString();
	}

}
