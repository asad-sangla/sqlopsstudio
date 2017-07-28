/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';

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
	registerExtensionInsight(id: string, val: IInsightsConfig): void;
	getRegisteredExtensionInsights(id: string): IInsightsConfig;
}

class InsightRegistry implements IInsightRegistry {
	private _insightSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.dashboardWidgets', 'Widget used in the dashboards'), properties: {}, additionalProperties: false };
	private _extensionInsights: { [x: string]: IInsightsConfig } = {};

	/**
	 * Register a dashboard widget
	 * @param id id of the widget
	 * @param description description of the widget
	 * @param schema config schema of the widget
	 */
	public registerInsight(id: string, description: string, schema: IJSONSchema): InsightIdentifier {
		this._insightSchema.properties[id] = schema;
		return id;
	}

	public registerExtensionInsight(id: string, val: IInsightsConfig): void {
		this._extensionInsights[id] = val;
	}

	public getRegisteredExtensionInsights(id: string): IInsightsConfig {
		return this._extensionInsights[id];
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
