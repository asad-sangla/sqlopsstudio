/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Registry } from 'vs/platform/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { registerDashboardWidget } from 'sql/platform/dashboard/common/widgetRegistry';
import { Extensions as InsightExtensions, IInsightRegistry } from 'sql/platform/dashboard/common/insightRegistry';
import { Extensions as TaskExtensions, ITaskRegistry } from 'sql/platform/tasks/taskRegistry';
import * as nls from 'vs/nls';

let insightRegistry = <IInsightRegistry>Registry.as(InsightExtensions.InsightContribution);
let taskRegistry = <ITaskRegistry>Registry.as(TaskExtensions.TaskContribution);

let insightsSchema: IJSONSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'object',
			properties: insightRegistry.insightSchema.properties,
			minItems: 1,
			maxItems: 1
		},
		query: {
			type: ['string', 'array']
		},
		queryFile: {
			type: 'string'
		},
		details: {
			type: 'object',
			properties: {
				query: {
					type: ['string', 'array']
				},
				queryFile: {
					type: 'string'
				},
				value: {
					type: 'string'
				},
				label: {
					type: ['string', 'object'],
					properties: {
						column: {
							type: 'string'
						},
						icon: {
							type: 'string'
						},
						state: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									condition: {
										type: 'object',
										properties: {
											if: {
												type: 'string',
												enum: ['equals', 'notEquals', 'greaterThanOrEquals', 'greaterThan', 'lessThanOrEquals', 'lessThan', 'always']
											},
											equals: {
												type: 'string'
											}
										}
									},
									color: {
										type: 'string'
									},
									icon: {
										type: 'string'
									}
								}
							}
						}
					}
				},
				actions: {
					type: 'object',
					properties: {
						types: {
							type: 'array',
							enum: taskRegistry.ids
						},
						database: {
							type: 'string',
							description: nls.localize('actionDatabaseDescription', 'Target database for the action; can use the format "${columnName} to use a data driven column name.')
						},
						server: {
							type: 'string',
							description: nls.localize('actionServerDescription', 'Target server for the action; can use the format "${columnName} to use a data driven column name.')
						},
						user: {
							type: 'string',
							description: nls.localize('actionUserDescription', 'Target user for the action; can use the format "${columnName} to use a data driven column name.')
						}
					}
				}
			}
		}
	}
};

registerDashboardWidget('insights-widget', '', insightsSchema);