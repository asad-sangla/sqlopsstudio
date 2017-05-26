/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { OnInit, Component, Inject, forwardRef } from '@angular/core';
import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage';
import { BreadcrumbClass, BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';
import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';

const widgets: Array<WidgetConfig> = [
	{
		name: 'Database Properties',
		icon: 'sql/media/icons/server-page-inverse.svg',
		selector: 'properties-widget',
		gridItemConfig: {
			sizex: 2,
			sizey: 1
		},
		context: 'server'
	},
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

@Component({
	selector: 'server-dashboard',
	templateUrl: require.toUrl('sql/parts/dashboard/pages/serverDashboardPage.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class ServerDashboardPage extends DashboardPage implements OnInit {

	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private breadcrumbService: BreadcrumbService) {
			super();
			this.widgets = widgets;
		}

	ngOnInit() {
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.ServerPage);
	}
}
