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
		iconClass: 'database',
		selector: 'properties-widget',
		context: 'database',
		background_color: colors.editorBackground,
		provider: undefined
	};

	protected widgets: Array<WidgetConfig> = [
		{
			name: 'Tasks',
			selector: 'tasks-widget',
			gridItemConfig: {
				sizex: 2,
				sizey: 1
			},
			context: 'database',
			provider: undefined
		},
		{
			selector: 'explorer-widget',
			gridItemConfig: {
				sizex: 2,
				sizey: 2
			},
			context: 'database',
			provider: undefined
		}
	];

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface
	) {
		super(dashboardService);
		this.propertiesConfig.provider = dashboardService.connectionManagementService.connectionInfo.providerId;
	}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.DatabasePage);
	}
}
