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
		iconClass: 'server-page',
		selector: 'properties-widget',
		context: 'server',
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
			context: 'server',
			provider: undefined
		},
		{
			selector: 'explorer-widget',
			gridItemConfig: {
				sizex: 2,
				sizey: 2
			},
			context: 'server',
			provider: undefined
		},
		{
			selector: 'insights-widget',
			context: 'server',
			provider: undefined,
			gridItemConfig: {},
			config: {
				type: 'count',
				query: `
						declare @condition tinyint;
						SET @condition = 24;

						with backupInsight_cte (database_id, last_backup, health_check)
						as
						(
							select
								d.database_id,
								max(b.backup_start_date) AS last_backup,
								case
									when (datediff( hh , max(b.backup_start_date) , getdate()) < @condition) then 1 else 0
								end as health_check
							from sys.databases as d
							left join msdb..backupset as b on d.name = b.database_name
							group by d.database_id
						)
						select
							sum(health_check) Healthy,
							sum(case when health_check = 0 AND last_backup IS NOT NULL then 1 else 0 end) Attention,
							sum(case when health_check = 0 then 1 else 0 end) Unheathly
						from backupInsight_cte
						`,
				colorMap: {
					'Healthy': 'green',
					'Attention': 'yellow',
					'Unheathly': 'red'
				}
			}
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
		this.breadcrumbService.setBreadcrumbs(BreadcrumbClass.ServerPage);
	}
}
