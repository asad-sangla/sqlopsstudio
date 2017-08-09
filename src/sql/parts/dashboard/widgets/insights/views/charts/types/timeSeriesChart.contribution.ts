/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mixin } from 'vs/base/common/objects';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';
import { chartInsightSchema } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.contribution';

import TimeSeriesChart from './timeSeriesChart.component';

const properties: IJSONSchema = {
};

const timeSeriesSchema = mixin(JSON.parse(JSON.stringify(chartInsightSchema)), properties) as IJSONSchema;

registerInsight('timeSeries', '', timeSeriesSchema, TimeSeriesChart);
