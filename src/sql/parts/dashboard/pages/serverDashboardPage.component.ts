/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { OnInit, Inject, forwardRef } from '@angular/core';

import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
import { BreadcrumbClass, BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';

const widgets: Array<WidgetConfig> = [
	{
		name: 'Tasks',
		selector: 'tasks-widget',
		gridItemConfig: {
			sizex: 3,
			sizey: 1
		},
		context: 'server'
	},
	{
		selector: 'explorer-widget',
		gridItemConfig: {
			sizex: 2,
			sizey: 2
		},
		context: 'server'
	}
];

export class ServerDashboardPage extends DashboardPage implements OnInit {
	private propertiesConfig: WidgetConfig = {
		name: 'Server Properties',
		icon: 'sql/media/icons/server_page.svg',
		inverse_icon: 'sql/media/icons/server_page_inverse.svg',
		selector: 'properties-widget',
		context: 'server',
		background_color: 'editorBackground'
	};

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private breadcrumbService: BreadcrumbService) {
			super();
			this.widgets = widgets;
		}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.ServerPage);
	}
}
