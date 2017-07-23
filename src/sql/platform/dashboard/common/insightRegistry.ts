/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as platform from 'vs/platform/registry/common/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';

export type InsightIdentifier = string;

export const Extensions = {
	InsightContribution: 'dashboard.contributions.insights'
};

export interface IInsightRegistry {
	insightSchema: IJSONSchema;
	registerInsight(id: string, description: string, schema: IJSONSchema): InsightIdentifier;
}

class InsightRegistry implements IInsightRegistry {
	private _insightSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.dashboardWidgets', 'Widget used in the dashboards'), properties: {}, additionalProperties: false };

	/**
	 * Register a dashboard widget
	 * @param id id of the widget
	 * @param description description of the widget
	 * @param schema config schema of the widget
	 * @param context either 'database' or 'server' for what page to register for; if not specified, will register for both
	 */
	public registerInsight(id: string, description: string, schema: IJSONSchema): InsightIdentifier {
		this._insightSchema.properties[id] = schema;
		return id;
	}

	public get insightSchema(): IJSONSchema {
		return this._insightSchema;
	}
}

const insightRegistry = new InsightRegistry();
platform.Registry.add(Extensions.InsightContribution, insightRegistry);

export function registerInsight(id: string, description: string, schema: IJSONSchema): InsightIdentifier {
	return insightRegistry.registerInsight(id, description, schema);
}
