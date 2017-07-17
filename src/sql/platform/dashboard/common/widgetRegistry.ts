/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as platform from 'vs/platform/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';

export type WidgetIdentifier = string;

export const Extensions = {
	DashboardWidgetContribution: 'dashboard.contributions.widgets'
};

export interface IDashboardWidgetRegistry {
	databaseWidgetSchema: IJSONSchema;
	serverWidgetSchema: IJSONSchema;
	registerWidget(id: string, description: string, schema: IJSONSchema): WidgetIdentifier;
	registerWidget(id: string, description: string, schema: IJSONSchema, context: 'database' | 'server'): WidgetIdentifier;
}

class DashboardWidgetRegistry implements IDashboardWidgetRegistry {
	private _dashboardWidgetSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.dashboardWidgets', 'Widget used in the dashboards'), properties: {}, additionalProperties: false };
	private _serverWidgetSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.dashboardWidgets', 'Widget used in the dashboards'), properties: {}, additionalProperties: false };
	/**
	 * Register a dashboard widget
	 * @param id id of the widget
	 * @param description description of the widget
	 * @param schema config schema of the widget
	 * @param context either 'database' or 'server' for what page to register for; if not specified, will register for both
	 */
	public registerWidget(id: string, description: string, schema: IJSONSchema, context?: 'database' | 'server'): WidgetIdentifier {
		if (context === undefined || context === 'database') {
			this._dashboardWidgetSchema.properties[id] = schema;
		}

		if (context === undefined || context === 'server') {
			this._serverWidgetSchema.properties[id] = schema;
		}

		return id;
	}

	public get databaseWidgetSchema(): IJSONSchema {
		return this._dashboardWidgetSchema;
	}

	public get serverWidgetSchema(): IJSONSchema {
		return this._serverWidgetSchema;
	}
}

const dashboardWidgetRegistry = new DashboardWidgetRegistry();
platform.Registry.add(Extensions.DashboardWidgetContribution, dashboardWidgetRegistry);

export function registerDashboardWidget(id: string, description: string, schema: IJSONSchema, context?: 'database' | 'server'): WidgetIdentifier {
	return dashboardWidgetRegistry.registerWidget(id, description, schema, context);
}
