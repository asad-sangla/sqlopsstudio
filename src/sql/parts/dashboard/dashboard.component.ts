/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { OnInit, Component, Inject, forwardRef, ElementRef, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';

import { DashboardServiceInterface } from './services/dashboardServiceInterface.service';

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
	private _subs: Array<IDisposable> = new Array();
	@ViewChild('header', {read: ElementRef}) private header: ElementRef;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrapService: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
		) { }

	ngOnInit() {
		let self = this;
		self._subs.push(self._bootstrapService.themeService.onDidColorThemeChange(e => self.updateTheme(e)));
		self.updateTheme(self._bootstrapService.themeService.getColorTheme());
	}

	ngOnDestroy() {
		this._subs.forEach((value) => {
			value.dispose();
		});
	}

	private updateTheme(theme: IColorTheme): void {
		this.header.nativeElement.style.borderBottomColor = theme.getColor(themeColors.SIDE_BAR_BACKGROUND, true).toString();
	}

}
