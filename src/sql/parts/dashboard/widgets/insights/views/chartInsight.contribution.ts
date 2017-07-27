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
			description: nls.localize('chartTypeDescription', 'The type of chart is being displayed - pie, line, etc.'),
			default: 'pie',
			enum: ['bar', 'doughnut', 'horizontalBar', 'line', 'pie', 'timeSeries', 'scatter']
		},
		labelFirstColumn: {
			type: 'boolean',
			description: nls.localize('labelFirstColumnDescription', 'If dataDirection is horizontal, setting this to true uses the first columns value for the legend.'),
			default: false
		},
		dataType: {
			type: 'string',
			description: nls.localize('dataTypeDescription', 'Indicates data property of a data set for a chart.'),
			default: 'number',
			enum: ['number', 'point'],
			enumDescriptions: ['Set "number" if the data values are contained in 1 column.', 'Set "point" if the data is an {x,y} combination requiring 2 columns for each value.']
		},
		dataDirection: {
			type: 'string',
			description: nls.localize('dataDirectionDescription', 'Defines whether the data is read from a column (vertical) or a row (horizontal). For time series this is ignored as direction must be vertical.'),
			default: 'vertical',
			enum: ['vertical', 'horizontal'],
			enumDescriptions: ['When vertical, the first column is used to define the x-axis labels, with other columns expected to be numerical.', 'When horizontal, the column names are used as the x-axis labels.']
		}
	}
};

registerInsight('chart', '', chartInsightSchema);