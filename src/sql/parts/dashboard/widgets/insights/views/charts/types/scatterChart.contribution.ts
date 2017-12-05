/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { mixin, clone } from 'vs/base/common/objects';
import { IJSONSchema } from 'vs/base/common/jsonSchema';

import { registerInsight } from 'sql/platform/dashboard/common/insightRegistry';
import { properties as BarChartSchema } from 'sql/parts/dashboard/widgets/insights/views/charts/types/barChart.contribution';

import ScatterChart from './scatterChart.component';

const properties: IJSONSchema = {
};

const scatterSchema = mixin(clone(BarChartSchema), properties) as IJSONSchema;

registerInsight('scatter', '', scatterSchema, ScatterChart);
