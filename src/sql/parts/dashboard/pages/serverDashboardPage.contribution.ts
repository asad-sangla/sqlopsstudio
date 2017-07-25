/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Registry } from 'vs/platform/registry/common/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { Extensions, IDashboardWidgetRegistry } from 'sql/platform/dashboard/common/widgetRegistry';
import * as nls from 'vs/nls';

let widgetRegistry = <IDashboardWidgetRegistry>Registry.as(Extensions.DashboardWidgetContribution);

export const serverDashboardPropertiesSchema: IJSONSchema = {
	description: nls.localize('dashboardServerProperties', 'Enable or disable the properties widget'),
	default: true,
	oneOf: [
		'boolean',
		{
			type: 'object',
			properties: {
				provider: {
					type: 'string'
				},
				edition: {
					type: 'number'
				}
			}
		}
	]
};

let defaultVal = [
	{
		name: 'Tasks',
		widget: {
			'tasks-widget': {}
		},
		gridItemConfig: {
			sizex: 2,
			sizey: 1
		}
	},
	{
		gridItemConfig: {
			sizex: 2,
			sizey: 2
		},
		widget: {
			'explorer-widget': {}
		}
	},
	{
		widget: {
			'insights-widget': {
				type: {
					'count': {}
				},
				query: [
					'declare @condition tinyint;',
					'SET @condition = 24;',
					'with backupInsight_cte (database_id, last_backup, health_check)',
					'as',
					'(',
					'select',
					'd.database_id,',
					'max(b.backup_start_date) AS last_backup,',
					'case',
					'when (datediff( hh , max(b.backup_start_date) , getdate()) < @condition) then 1 else 0',
					'end as health_check',
					'from sys.databases as d',
					'left join msdb..backupset as b on d.name = b.database_name',
					'group by d.database_id',
					')',
					'select',
					'sum(health_check) Healthy,',
					'sum(case when health_check = 0 AND last_backup IS NOT NULL then 1 else 0 end) Attention,',
					'sum(case when health_check = 0 then 1 else 0 end) Unheathly',
					'from backupInsight_cte'
				],
				details: {
					query: [
						'declare @condition tinyint;',
						'SET @condition = 24;',
						'select',
						'd.name,',
						'max(b.backup_start_date) AS last_backup,',
						'case',
						'when (datediff( hh , max(b.backup_start_date) , getdate()) < @condition) then 1 else 0',
						'end as health_check',
						'from sys.databases as d',
						'left join msdb..backupset as b on d.name = b.database_name',
						'group by d.name',
					],
					label: {
						column: 'name',
						icon: 'database',
						state: [
							{
								condition: {
									if: 'equals',
									equals: '1'
								},
								color: 'green'
							},
							{
								condition: {
									if: 'equals',
									equals: '0'
								},
								color: 'red'
							}
						]
					},
					value: 'health_check',
					actions: {
						types: ['backup', 'restore'],
						database: '${name}'
					}
				}
			}
		}
	}
];

export const serverDashboardSettingSchema: IJSONSchema = {
	type: ['array'],
	description: nls.localize('dashboardServer', 'Customizes the server dashboard page'),
	items: {
		type: 'object',
		properties: {
			name: {
				type: 'string'
			},
			icon: {
				type: 'string'
			},
			provider: {
				type: 'string'
			},
			edition: {
				type: 'number'
			},
			gridItemConfig: {
				type: 'object',
				properties: {
					sizex: {
						type: 'number'
					},
					sizey: {
						type: 'number'
					}
				}
			},
			widget: {
				type: 'object',
				properties: widgetRegistry.serverWidgetSchema.properties,
				maxItems: 1
			}
		}
	},
	default: defaultVal
};

export const SERVER_DASHBOARD_SETTING = 'dashboard.server.widgets';
export const SERVER_DASHBOARD_PROPERTIES = 'dashboard.server.properties';