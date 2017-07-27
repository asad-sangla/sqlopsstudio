/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef, ElementRef } from '@angular/core';

/* SQL Imports */
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IInsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

/* VS Imports */
import * as colors from 'vs/platform/theme/common/colorRegistry';
import { mixin } from 'vs/base/common/objects';
import { Color, RGBA } from 'vs/base/common/color';

export type ChartType = 'bar' | 'doughnut' | 'horizontalBar' | 'line' | 'pie' | 'timeSeries' | 'scatter';
export type DataType = 'number' | 'point';
export type DataDirection = 'vertical' | 'horizontal';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';
const validChartTypes = ['bar', 'doughnut', 'horizontalBar', 'line', 'pie', 'timeSeries', 'scatter'];
const validDataTypes = ['number', 'point'];
const validDataDirection = ['vertical', 'horizontal'];

export interface IDataSet {
	data: Array<number>;
	label?: string;
}

export interface IPointDataSet {
	data: Array<{ x: number, y: number }>;
	label?: string;
	fill: boolean;
	backgroundColor?: Color;
}

export interface IChartConfig {
	colorMap?: { [column: string]: string };
	legendPosition?: LegendPosition;
	chartType?: ChartType;
}

@Component({
	template: `	<div style="display: block">
					<canvas *ngIf="isDataAvailable" #chart
							baseChart
							[datasets]="chartData"
							[labels]="labels"
							[chartType]="chartType"
							[colors]="_colors"
							[options]="_options"
							[style.width.px]="width"
 							[style.height.px]="height"></canvas>
				</div>`
})
export class ChartInsight implements IInsightsView {
	public readonly customFields = ['chartType', 'colorMap', 'labelFirstColumn', 'legendPosition', 'dataType', 'dataDirection'];
	public isDataAvailable: boolean = false;
	private _data: SimpleExecuteResult;
	private _labels: string[] = [];
	private _labelFirstColumn: boolean;
	private _dataType: DataType;
	private _dataDirection: DataDirection;
	private _rawChartData: Array<any[]> = [];
	private _chartType: ChartType = 'pie';
	private _colors: any[] = [];
	private _options: any = {};
	public width: number;
	public height: number;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef) { }

	init() {
		this._calcHeightWidth();

		// Note: must use a boolean to not render the canvas until all properties such as the labels and chart type are set.
		// This is because chart.js doesn't auto-update anything other than dataset when re-rendering so defaults are used
		// hence it's easier to not render until ready
		this.isDataAvailable = true;
		if (this._dataDirection === 'vertical' && this._chartType !== 'timeSeries') {
			this._labels = this._rawChartData.map((row) => {
				return row[0];
			});
		}
		this._changeRef.detectChanges();
	}

	private _calcHeightWidth(): void {
		if (this.isSquareChart) {
			let size = Math.min(this._el.nativeElement.parentElement.offsetHeight, this._el.nativeElement.parentElement.offsetWidth);
			this.width = size;
			this.height = size;
		} else {
			this.width = this._el.nativeElement.parentElement.offsetWidth;
			this.height = this._el.nativeElement.parentElement.offsetHeight;
		}
	}

	private get isSquareChart(): boolean {
		return ['pie', 'doughnut'].indexOf(this._chartType) > -1;
	}

	@Input() set data(data: SimpleExecuteResult) {
		this._data = data;
		this._labels = data.columnInfo.map((item) => {
			return item.columnName;
		});
		this._rawChartData = [];
		data.rows.forEach((row, rowIndex) => {
			this._rawChartData[rowIndex] = data.rows[rowIndex].map((item, index) => {
				return item.displayValue;
			});
		});

		this._changeRef.detectChanges();
	}

	public get chartData() {
		let self = this;
		if (this._dataType === 'number') {
			if (this._dataDirection === 'vertical') {
				return self._mapDataSetInVertical();
			} else {
				return this._rawChartData.map((row) => {
					return self._mapRowToDataSet(row);
				});
			}
		} else {
			return self._mapToPointDataSet();
		}
	}

	private _mapDataSetInVertical(): IDataSet[] {
		let dataSetMap: { [label: string]: IDataSet } = {};
		this._rawChartData.map((row) => {
			if (row && row.length > 1) {
				for (let colIndex = 1; colIndex < row.length; colIndex++) {
					let legend = this._data.columnInfo[colIndex].columnName;
					if (!dataSetMap[legend]) {
						dataSetMap[legend] = { label: legend, data: [] };
					}
					dataSetMap[legend].data.push(Number(row[colIndex]));
				}
			}
		});
		let dataSet: IDataSet[] = [];
		for (var key in dataSetMap) {
			dataSet.push(dataSetMap[key]);
		}
		return dataSet;
	}

	private _mapToPointDataSet(): IPointDataSet[] {
		let dataSetMap: { [label: string]: IPointDataSet } = {};
		this._rawChartData.map((row) => {
			if (row && row.length >= 3) {
				let legend = row[0];
				if (!dataSetMap[legend]) {
					dataSetMap[legend] = { label: legend, data: [], fill: false };
				}
				dataSetMap[legend].data.push({ x: row[1], y: Number(row[2]) });

				if (this._chartType === 'scatter') {
					dataSetMap[legend].backgroundColor = Color.cyan;
				}
			}
		});
		let dataSet: IPointDataSet[] = [];
		for (var key in dataSetMap) {
			dataSet.push(dataSetMap[key]);
		}
		return dataSet;
	}

	private _mapRowToDataSet(row: Array<any>): IDataSet {
		let dataSet: IDataSet = { data: [] };
		if (row && row.length > 0) {
			let colIndex = 0;
			if (this._labelFirstColumn) {
				dataSet.label = row[0];
				colIndex = 1;
			} else {
				dataSet.label = 'Row ' + colIndex;
			}
			for (colIndex; colIndex < row.length; colIndex++) {
				dataSet.data.push(Number(row[colIndex]));
			}
		}
		return dataSet;
	}

	@Input() public set chartType(chartType: ChartType) {
		if (chartType && validChartTypes.includes(chartType)) {
			this._chartType = chartType;
		} else {
			this._chartType = 'pie';
		}

		if (this._chartType === 'timeSeries') {
			this.addOptionsForTimeSeries();
		} else if (this._chartType === 'scatter') {
			this.addOptionsForScatter();
		}
	}


	public get chartType(): ChartType {
		if (this._chartType === 'timeSeries') {
			return 'line';
		}
		return this._chartType;
	}

	private addOptionsForTimeSeries(): void {
		let xLabel = 'Time';
		let yLabel = 'Value';
		if (this._labels.length >= 3) {
			xLabel = this._labels[1];
			yLabel = this._labels[2];
		}
		let options = {
			scales: {
				xAxes: [{
					type: 'time',
					display: true,
					scaleLabel: {
						display: true,
						labelString: xLabel,
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					ticks: {
						autoSkip: false,
						maxRotation: 45,
						minRotation: 45,
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
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
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					ticks: {
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}]
			}
		};

		this._options = Object.assign({}, mixin(this._options, options));
	}

	private addOptionsForScatter(): void {
		let xLabel = 'Time';
		let yLabel = 'Value';
		if (this._labels.length >= 3) {
			xLabel = this._labels[1];
			yLabel = this._labels[2];
		}
		let options = {
			scales: {
				xAxes: [{
					type: 'linear',
					position: 'bottom',
					display: true,
					scaleLabel: {
						display: true,
						labelString: xLabel,
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					ticks: {
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
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
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					ticks: {
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					},
					gridLines: {
						color: Color.fromRGBA(new RGBA(143, 143, 143, 150))
					}
				}]
			}
		};

		this._options = Object.assign({}, mixin(this._options, options));
	}

	public get labels(): string[] {
		if (!this._labels || this._labels.length === 0) {
			return [];
		}
		if (this._labelFirstColumn) {
			return this._labels.slice(1);
		}
		return this._labels;
	}

	@Input() set colorMap(map: { [column: string]: string }) {
		if (map) {
			let backgroundColor = this._labels.map((item) => {
				return map[item];
			});
			let colorsMap = { backgroundColor };
			this._colors = [colorsMap];
			let options = {
				legend: {
					labels: {
						fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
					}
				}
			};
			this._options = options;
		}
	}

	@Input() set labelFirstColumn(labelFirstColumn: boolean) {
		this._labelFirstColumn = labelFirstColumn;
	}

	@Input() public set dataType(dataType: DataType) {
		if (dataType && validDataTypes.includes(dataType)) {
			this._dataType = dataType;
		} else {
			this._dataType = 'number';
		}
	}

	@Input() public set dataDirection(dataDirection: DataDirection) {
		if (dataDirection && validDataDirection.includes(dataDirection)) {
			this._dataDirection = dataDirection;
		} else {
			this._dataDirection = 'vertical';
		}
	}

	@Input() set legendPosition(position: LegendPosition) {
		if (position) {
			let options;

			if (!this._options) {
				options = {
					legend: {}
				};
			} else if (!this._options.legend) {
				options = Object.assign({}, this._options);
				options.legend = {};
			} else {
				options = Object.assign({}, this._options);
			}

			if (position === 'none') {
				options.legend.display = false;
			} else {
				options.legend.position = position;
			}

			this._options = options;
		}
	}
}