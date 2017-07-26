/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';

import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';

let chartInsightSchema: IJSONSchema = {
	type: 'object',
	description: nls.localize('chartInsightDescription', 'Displays results of a query as a chart on the dashboard'),
	properties: {
		colorMap: {
			type: 'object',
			description: nls.localize('colorMapDescription', 'Maps "column name" -> color. for example add "column1": red to ensure this column uses a red color ')
		},
		legendPosition: {
			type: 'string',
			description: nls.localize('legendDescription', 'Indicates preferred position and visibility of the chart legend. These are the column names from your query, and map to the label of each chart entry'),
			default: 'none',
			enum: ['top', 'bottom', 'left', 'right', 'none']
		},
		chartType: {
			type: 'string',
			description: nls.localize('chartTypeDescription', 'THe type of chart is being displayed - pie, line, etc.'),
			default: 'pie',
			enum: ['bar', 'doughnut', 'horizontalBar', 'line', 'pie', 'timeSeries']
		},
		labelFirstColumn: {
			type: 'boolean',
			description: nls.localize('labelFirstColumnDescription', 'If true, the first column will be treated as a label to describe the rest of the data in the row'),
			default: false
		},
		dataType: {
			type: 'string',
			description: nls.localize('dataTypeDescription', 'Indicate the data property of a dataset for a chart'),
			default: 'number',
			enum: ['number', 'point']
		}
	}
};

registerInsight('chart', '', chartInsightSchema);