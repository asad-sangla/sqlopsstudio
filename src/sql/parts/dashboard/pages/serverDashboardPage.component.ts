/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit, Inject, forwardRef } from '@angular/core';

import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
import { BreadcrumbClass, BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import * as colors from 'vs/platform/theme/common/colorRegistry';

export class ServerDashboardPage extends DashboardPage implements OnInit {
	private propertiesConfig: WidgetConfig = {
		name: 'Server Properties',
		icon: 'server-page',
		widget: {
			'properties-widget': undefined
		},
		context: 'server',
		background_color: colors.editorBackground,
		provider: undefined
	};

	protected widgets: Array<WidgetConfig>;

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface
	) {
		super(dashboardService);
		this.widgets = dashboardService.serverPageSettings.filter((item) => {
			return item.provider === undefined || item.provider === dashboardService.connectionManagementService.connectionInfo.providerId;
		});
		this.addProvider([this.propertiesConfig]);
		this.addContext('server');
		this.validateConfig();
	}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.ServerPage);
	}
}
