/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mixin, clone } from 'vs/base/common/objects';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';

import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';
import { chartInsightSchema } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.contribution';

import BarChart from './barChart.component';

export const properties: IJSONSchema = {
	properties: {
		yAxisMin: {
			type: 'number',
			description: nls.localize('yAxisMin', "Minumum value of the y axis")
		},
		yAxisMax: {
			type: 'number',
			description: nls.localize('yAxisMax', "Maximum value of the y axis")
		},
		yAxisLabel: {
			type: 'string',
			description: nls.localize('yAxisLabel', "Label for the y axis")
		},
		xAxisMin: {
			type: 'number',
			description: nls.localize('xAxisMin', "Minumum value of the x axis")
		},
		xAxisMax: {
			type: 'number',
			description: nls.localize('xAxisMax', "Maximum value of the x axis")
		},
		xAxisLabel: {
			type: 'string',
			description: nls.localize('xAxisLabel', "Label for the x axis")
		}
	}
};

const barSchema = mixin(clone(chartInsightSchema), properties) as IJSONSchema;

registerInsight('bar', '', barSchema, BarChart);
