/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defaultChartConfig, IPointDataSet, ChartType } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.component';
import LineChart, { ILineConfig } from './lineChart.component';

import { mixin } from 'vs/base/common/objects';
import { Color, RGBA } from 'vs/base/common/color';

const defaultTimeSeriesConfig = mixin(JSON.parse(JSON.stringify(defaultChartConfig)), { dataType: 'point', dataDirection: 'horizontal' }) as ILineConfig;

export default class TimeSeriesChart extends LineChart {
	protected _defaultConfig = defaultTimeSeriesConfig;

	protected addAxisLabels(): void {
		let xLabel = this.getLabels()[1] || 'x';
		let yLabel = this.getLabels()[2] || 'y';

		let options = {
			scales: {
				xAxes: [{
					type: 'time',
					display: true,
					scaleLabel: {
						display: true,
						labelString: xLabel
					},
					ticks: {
						autoSkip: false,
						maxRotation: 45,
						minRotation: 45
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}],

				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: yLabel
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}]
			}
		};

		this.options = Object.assign({}, mixin(this.options, options));
	}

	protected getDataAsPoint(): Array<IPointDataSet> {
		let dataSetMap: { [label: string]: IPointDataSet } = {};
		this._data.rows.map(row => {
			if (row && row.length >= 3) {
				let legend = row[0];
				if (!dataSetMap[legend]) {
					dataSetMap[legend] = { label: legend, data: [], fill: false };
				}
				dataSetMap[legend].data.push({ x: row[1], y: Number(row[2]) });

				if (this.chartType === ChartType.Scatter) {
					dataSetMap[legend].backgroundColor = Color.cyan;
				}
			}
		});
		return Object.values(dataSetMap);
	}
}
