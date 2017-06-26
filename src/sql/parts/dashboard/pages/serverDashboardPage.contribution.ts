/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Registry } from 'vs/platform/platform';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';

let configurationRegistry = <IConfigurationRegistry>Registry.as(Extensions.Configuration);
configurationRegistry.registerConfiguration({
	'id': 'serverDashboardPage',
	'title': 'Server Dashboard Page',
	'type': 'object',
	'properties': {
		'dashboard.serverPage': {
			'description': 'Server Page Settings',
			'type': 'array',
			'default': [
				{
					'name': 'Tasks',
					'selector': 'tasks-widget',
					'gridItemConfig': {
						'sizex': 2,
						'sizey': 1
					}
				},
				{
					'selector': 'explorer-widget',
					'gridItemConfig': {
						'sizex': 2,
						'sizey': 2
					}
				},
				{
					'selector': 'insights-widget',
					'gridItemConfig': {},
					'config': {
						'type': 'count',
						'query': `
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
						'colorMap': {
							'Healthy': 'green',
							'Attention': 'yellow',
							'Unheathly': 'red'
						}
					}
				}
			]
		}
	}
});