/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mixin, clone } from 'vs/base/common/objects';
import { IJSONSchema } from 'vs/base/common/jsonSchema';

import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';
import { properties as BarChartSchema } from 'sql/parts/dashboard/widgets/insights/views/charts/types/barChart.contribution';

import TimeSeriesChart from './timeSeriesChart.component';

const properties: IJSONSchema = {
};

const timeSeriesSchema = mixin(clone(BarChartSchema), properties) as IJSONSchema;

registerInsight('timeSeries', '', timeSeriesSchema, TimeSeriesChart);
