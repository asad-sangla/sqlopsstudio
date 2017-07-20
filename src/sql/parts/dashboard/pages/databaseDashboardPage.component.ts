/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit, Inject, forwardRef } from '@angular/core';

import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
import { BreadcrumbClass, BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';

import * as colors from 'vs/platform/theme/common/colorRegistry';

export class DatabaseDashboardPage extends DashboardPage implements OnInit {
	private propertiesConfig: WidgetConfig = {
		name: 'Database Properties',
		icon: 'database',
		widget: {
			'properties-widget': undefined
		},
		context: 'database',
		background_color: colors.editorBackground,
		provider: undefined
	};

	protected widgets: Array<WidgetConfig>;
	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface
	) {
		super(dashboardService);
		this.widgets = dashboardService.databasePageSettings.filter((item) => {
			return item.provider === undefined || item.provider === dashboardService.connectionManagementService.connectionInfo.providerId;
		});
		this.addProvider([this.propertiesConfig]);
		this.addContext('database');
		this.validateConfig();
	}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.DatabasePage);
	}
}
