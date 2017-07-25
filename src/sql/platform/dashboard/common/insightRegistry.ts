/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join } from 'path';

import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { registerNonCustomDashboardWidget } from 'sql/platform/dashboard/common/widgetRegistry';

import * as platform from 'vs/platform/registry/common/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';
import { IExtensionPointUser, ExtensionsRegistry } from 'vs/platform/extensions/common/extensionsRegistry';

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

interface IInsightTypeContrib {
	id: string;
	contrib: IInsightsConfig;
}

const insightTypeDetailsActions: IJSONSchema = {
	description: nls.localize('carbon.extension.contributes.insightType.details.actions', 'Object specifying what actions to provide and what context to execute them with'),
	type: 'object',
	properties: {
		types: {
			type: 'array',
			description: nls.localize('carbon.extension.contributes.insightType.details.actions.types', 'Array of action names to provide'),
			items: 'string'
		},
		database: {
			type: 'string',
			description: nls.localize('carbon.extension.contributes.insightType.details.actions.database', 'Value to use as the database; to use a column value use ${columnName}')
		},
		server: {
			type: 'string',
			description: nls.localize('carbon.extension.contributes.insightType.details.actions.server', 'Value to use as the server; to use a column value use ${columnName}')
		},
		user: {
			type: 'string',
			description: nls.localize('carbon.extension.contributes.insightType.details.actions.user', 'Value to use as the user; to use a column value use ${columnName}')
		}
	}
};

const insightTypeDetailsLabel: IJSONSchema = {
	description: nls.localize('carbon.extension.contributes.insightType.details.label.object', 'Object describing the label object'),
	type: 'object',
	properties: {
		column: {
			type: 'string',
			description: nls.localize('carbon.extension.contributes.insightType.details.label.object.column', 'Column name to use as the label')
		},
		icon: {
			type: 'string',
			description: nls.localize('carbon.extension.contributes.insightType.details.label.object.icon', 'Class string to use as the icon for the label')
		},
		state: {
			type: 'array',
			description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state', 'Array of objects that describe how to render the state'),
			items: {
				type: 'object',
				properties: {
					condition: {
						type: 'object',
						description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state.condition', 'Object describing how to determine if this is the right state'),
						properties: {
							if: {
								type: 'string',
								enum: ['equals', 'notEquals', 'greaterThanOrEquals', 'greaterThan', 'lessThanOrEquals', 'lessThan', 'always'],
								description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state.condition.if', 'What comparator to use')
							},
							equals: {
								type: 'string',
								description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state.condition.equals', 'Value to compare the value with')
							}
						}
					},
					color: {
						type: 'string',
						description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state.color', 'Color to use as a badge')
					},
					icon: {
						type: 'string',
						description: nls.localize('carbon.extension.contributes.insightType.details.label.object.state.icon', 'Icon class to use as a badge')
					}
				}
			}
		}
	}
};

const insightTypeDetails: IJSONSchema = {
	description: nls.localize('carbon.extension.contributes.insightType.details', 'Configures the insight flyout for this widget'),
	type: 'object',
	properties: {
		query: {
			description: nls.localize('carbon.extension.contributes.insightType.details.query', 'Query for the flyout'),
			anyOf: ['string', { type: 'array', items: 'string' }]
		},
		queryFile: {
			description: nls.localize('carbon.extension.contributes.insightType.details.queryFile', 'Query file for the flyout'),
			type: 'string'
		},
		label: {
			description: nls.localize('carbon.extension.contributes.insightType.details.label', 'Name of the column to use as the label or an object describing the column'),
			anyOf: [
				'string',
				insightTypeDetailsLabel
			]
		},
		value: {
			description: nls.localize('carbon.extension.contributes.insightType.details.value', 'Name of the column to use as a value'),
			type: 'string'
		},
		actions: insightTypeDetailsActions
	}
};

const insightType: IJSONSchema = {
	type: 'object',
	properties: {
		id: {
			description: nls.localize('carbon.extension.contributes.insightType.id', 'Identifier of the insight'),
			type: 'string'
		},
		contrib: {
			type: 'object',
			properties: {
				type: {
					description: nls.localize('carbon.extension.contributes.insightType.chartType', 'Chart type of the insight'),
					type: 'string',
					enum: ['chart', 'count']
				},
				query: {
					description: nls.localize('carbon.extension.contributes.insightType.query', 'Query for the insight'),
					type: ['string', 'array']
				},
				queryFile: {
					description: nls.localize('carbon.extension.contributes.insightType.queryFile', 'Query file for the insight'),
					type: 'string'
				},
				details: insightTypeDetails
			}
		}
	}
};

const insightsContribution: IJSONSchema = {
	description: nls.localize('carbon.extension.contributes.insights', "Contributes insights to the dashboard palette."),
	oneOf: [
		insightType,
		{
			type: 'array',
			items: insightType
		}
	]
};

ExtensionsRegistry.registerExtensionPoint<IInsightTypeContrib | IInsightTypeContrib[]>('insights', [], insightsContribution).setHandler(extensions => {

	function handleCommand(insight: IInsightTypeContrib, extension: IExtensionPointUser<any>) {

		if (insight.contrib.queryFile) {
			insight.contrib.queryFile = join(extension.description.extensionFolderPath, insight.contrib.queryFile);
		}

		registerNonCustomDashboardWidget(insight.id, '', insight.contrib);
		insightRegistry.registerExtensionInsight(insight.id, insight.contrib);
	}

	for (let extension of extensions) {
		const { value } = extension;
		if (Array.isArray<IInsightTypeContrib>(value)) {
			for (let command of value) {
				handleCommand(command, extension);
			}
		} else {
			handleCommand(value, extension);
		}
	}
});
