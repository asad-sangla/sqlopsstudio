/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit, Inject, forwardRef, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
import { BreadcrumbClass } from 'sql/parts/dashboard/services/breadcrumb.service';
import { IBreadcrumbService } from 'sql/base/browser/ui/breadcrumb/interfaces';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';

import * as colors from 'vs/platform/theme/common/colorRegistry';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';

export class DatabaseDashboardPage extends DashboardPage implements OnInit, OnDestroy {
	protected propertiesWidget: WidgetConfig = {
		name: 'Database Properties',
		icon: 'database',
		widget: {
			'properties-widget': undefined
		},
		context: 'database',
		background_color: colors.editorBackground,
		provider: undefined,
		edition: undefined
	};

	protected readonly context = 'database';
	private _dispose: IDisposable[] = [];

	constructor(
		@Inject(forwardRef(() => IBreadcrumbService)) private _breadcrumbService: IBreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _cd: ChangeDetectorRef
	) {
		super(dashboardService);
		this._dispose.push(dashboardService.onUpdatePage(() => {
			this.init();
			this._cd.detectChanges();
		}));
		this.init();
	}

	ngOnInit() {
		this._breadcrumbService.setBreadcrumbs(BreadcrumbClass.DatabasePage);
	}

	ngOnDestroy() {
		this._dispose = dispose(this._dispose);
	}
}
