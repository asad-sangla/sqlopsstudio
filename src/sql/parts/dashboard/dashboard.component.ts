/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { OnInit, Component, Inject, forwardRef, ElementRef, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardServiceInterface } from './services/dashboardServiceInterface.service';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IDisposable } from 'vs/base/common/lifecycle';
import * as themeColors from 'vs/workbench/common/theme';

export const DASHBOARD_SELECTOR: string = 'dashboard-component';

@Component({
	selector: DASHBOARD_SELECTOR,
	templateUrl: decodeURI(require.toUrl('./dashboard.component.html'))
})
export class DashboardComponent implements OnInit, OnDestroy {
	private _subs: Array<IDisposable> = new Array();
	@ViewChild('header', { read: ElementRef }) private header: ElementRef;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrapService: DashboardServiceInterface,
		@Inject(forwardRef(() => Router)) private _router: Router,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
	) { }

	ngOnInit() {
		let self = this;
		self._subs.push(self._bootstrapService.themeService.onDidColorThemeChange(e => self.updateTheme(e)));
		self.updateTheme(self._bootstrapService.themeService.getColorTheme());
		let profile: IConnectionProfile = self._bootstrapService.getOriginalConnectionProfile();
		if (profile && (!profile.databaseName || self.isMasterMssql(profile))) {
			// Route to the server page as this is the default database
			self._router.navigate(['server-dashboard']);
		}
	}


	private isMasterMssql(profile: IConnectionProfile): boolean {
		return profile.providerName.toLowerCase() === 'mssql'
			&& profile.databaseName.toLowerCase() === 'master';
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
