/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit, Inject, forwardRef } from '@angular/core';

import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
import { BreadcrumbClass } from 'sql/parts/dashboard/services/breadcrumb.service';
import { IBreadcrumbService } from 'sql/base/browser/ui/breadcrumb/interfaces';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import * as colors from 'vs/platform/theme/common/colorRegistry';

export class ServerDashboardPage extends DashboardPage implements OnInit {
	protected propertiesWidget: WidgetConfig = {
		name: 'Server Properties',
		icon: 'server-page',
		widget: {
			'properties-widget': undefined
		},
		context: 'server',
		background_color: colors.editorBackground,
		provider: undefined,
		edition: undefined
	};

	protected readonly context = 'server';

	constructor(
		@Inject(forwardRef(() => IBreadcrumbService)) private breadcrumbService: IBreadcrumbService,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface
	) {
		super(dashboardService);
		this.init();
	}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.ServerPage);
		this.dashboardService.connectionManagementService.connectionInfo.connectionProfile.databaseName = null;
	}
}
