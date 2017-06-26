/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Registry } from 'vs/platform/platform';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';

let configurationRegistry = <IConfigurationRegistry>Registry.as(Extensions.Configuration);
configurationRegistry.registerConfiguration({
	'id': 'databaseDashboardPage',
	'title': 'Database Dashboard Page',
	'type': 'object',
	'properties': {
		'dashboard.databasePage': {
			'description': 'Database Page Settings',
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
				}
			]
		}
	}
});