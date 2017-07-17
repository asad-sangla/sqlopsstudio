/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Registry } from 'vs/platform/platform';
import { IConfigurationRegistry, Extensions, IConfigurationNode } from 'vs/platform/configuration/common/configurationRegistry';
import { DATABASE_DASHBOARD_SETTING, databaseDashboardSettingSchema } from 'sql/parts/dashboard/pages/databaseDashboardPage.contribution';
import { SERVER_DASHBOARD_SETTING, serverDashboardSettingSchema } from 'sql/parts/dashboard/pages/serverDashboardPage.contribution';

const configurationRegistry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);
const dashboardConfig: IConfigurationNode = {
	id: 'dashboard',
	type: 'object',
	properties: {
		[DATABASE_DASHBOARD_SETTING]: databaseDashboardSettingSchema,
		[SERVER_DASHBOARD_SETTING]: serverDashboardSettingSchema
	}
};

configurationRegistry.registerConfiguration(dashboardConfig);
