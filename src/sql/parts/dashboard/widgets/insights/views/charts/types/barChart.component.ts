/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChartInsight, ChartType, customMixin } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.component';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import * as colors from 'vs/platform/theme/common/colorRegistry';
import { mixin } from 'sql/base/common/objects';

export default class BarChart extends ChartInsight {
	protected readonly chartType: ChartType = 'bar';

	protected updateTheme(e: IColorTheme): void {
		super.updateTheme(e);
		let options = {
			scales: {
				xAxes: [{
					scaleLabel: {
						fontColor: e.getColor(colors.editorForeground)
					},
					ticks: {
						fontColor: e.getColor(colors.editorForeground)
					}
				}],
				yAxes: [{
					scaleLabel: {
						fontColor: e.getColor(colors.editorForeground)
					},
					ticks: {
						fontColor: e.getColor(colors.editorForeground)
					}
				}]
			}
		};

		this.options = mixin({}, mixin(this.options, options, true, customMixin));
	}
}
