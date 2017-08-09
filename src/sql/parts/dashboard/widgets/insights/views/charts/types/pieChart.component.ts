/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChartInsight, ChartType } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.component';

export default class PieChart extends ChartInsight {
	protected readonly chartType: ChartType = 'pie';
}
