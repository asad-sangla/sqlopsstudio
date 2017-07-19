/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { Extensions, IDashboardWidgetRegistry } from 'sql/platform/dashboard/common/widgetRegistry';
import * as nls from 'vs/nls';

let widgetRegistry = <IDashboardWidgetRegistry>Registry.as(Extensions.DashboardWidgetContribution);

export const databaseDashboardSettingSchema: IJSONSchema = {
	type: ['array'],
	description: nls.localize('dashboardDatabase', 'Customizes the database dashboard page'),
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
				properties: widgetRegistry.databaseWidgetSchema.properties,
				minItems: 1,
				maxItems: 1
			}
		}
	},
	default: [
		{
			name: 'Tasks',
			gridItemConfig: {
				sizex: 2,
				sizey: 1
			},
			widget: {
				'tasks-widget': {}
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
		}
	]
};

export const DATABASE_DASHBOARD_SETTING = 'dashboard.database';