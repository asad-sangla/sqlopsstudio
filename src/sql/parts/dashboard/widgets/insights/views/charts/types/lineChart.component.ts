/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ChartType, customMixin, IChartConfig, defaultChartConfig, IDataSet, IPointDataSet } from 'sql/parts/dashboard/widgets/insights/views/charts/chartInsight.component';
import BarChart from './barChart.component';
import { memoize, unmemoize } from 'sql/common/decorators';

import { mixin } from 'sql/base/common/objects';
import { Color, RGBA } from 'vs/base/common/color';

export type DataType = 'number' | 'point';

export interface ILineConfig extends IChartConfig {
	dataType?: DataType;
}

const defaultLineConfig = mixin(JSON.parse(JSON.stringify(defaultChartConfig)), { dataType: 'number' }) as ILineConfig;

export default class LineChart extends BarChart {
	protected readonly chartType: ChartType = 'line';
	protected _config: ILineConfig;
	protected _defaultConfig = defaultLineConfig;

	public init() {
		if (this._config.dataType === 'point') {
			this.addAxisLabels();
		}
		super.init();
	}

	public get chartData(): Array<IDataSet | IPointDataSet> {
		if (this._config.dataType === 'number') {
			return super.getChartData();
		} else {
			return this.getDataAsPoint();
		}
	}

	protected clearMemoize() {
		super.clearMemoize();
		unmemoize(this, 'getDataAsPoint');
	}

	@memoize
	protected getDataAsPoint(): Array<IPointDataSet> {
		let dataSetMap: { [label: string]: IPointDataSet } = {};
		this._data.rows.map(row => {
			if (row && row.length >= 3) {
				let legend = row[0];
				if (!dataSetMap[legend]) {
					dataSetMap[legend] = { label: legend, data: [], fill: false };
				}
				dataSetMap[legend].data.push({ x: Number(row[1]), y: Number(row[2]) });
			}
		});
		return Object.values(dataSetMap);
	}

	public get labels(): Array<string> {
		if (this._config.dataType === 'number') {
			return super.getLabels();
		} else {
			return [];
		}
	}

	protected addAxisLabels(): void {
		let xLabel = this._data.columns[1] || 'x';
		let yLabel = this._data.columns[2] || 'y';
		let options = {
			scales: {
				xAxes: [{
					type: 'linear',
					position: 'bottom',
					display: true,
					scaleLabel: {
						display: true,
						labelString: xLabel
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}],

				yAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: yLabel,
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}]
			}
		};

		this.options = mixin(this.options, options, true, customMixin);
	}
}