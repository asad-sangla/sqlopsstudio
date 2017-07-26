/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef, ViewChild, ElementRef } from '@angular/core';

/* SQL Imports */
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IInsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

/* VS Imports */
import * as colors from 'vs/platform/theme/common/colorRegistry';

export type ChartType = 'bar' | 'doughnut' | 'horizontalBar' | 'line' | 'pie';
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';
const validChartTypes = ['bar', 'doughnut', 'horizontalBar', 'line', 'pie'];

export interface IDataSet {
	data: Array<number>;
	label?: string;
}
export interface IChartConfig {
	colorMap?: { [column: string]: string };
	legendPosition?: LegendPosition;
	chartType?: ChartType;
}

@Component({
	template: `	<div #container style="display: block">
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
	public readonly customFields = ['chartType', 'colorMap', 'labelFirstColumn', 'legendPosition'];
	public isDataAvailable: boolean = false;
	private _data: SimpleExecuteResult;
	private _labels: string[] = [];
	private _labelFirstColumn: boolean;
	private _rawChartData: Array<any[]> = [];
	private _chartType: ChartType = 'pie';
	private _colors: any[] = [];
	private _options: any = {};
	public width: number;
	public height: number;
	@ViewChild('container') private container: ElementRef;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) { }

	init() {
		this._calcHeightWidth();

		// Note: must use a boolean to not render the canvas until all properties such as the labels and chart type are set.
		// This is because chart.js doesn't auto-update anything other than dataset when re-rendering so defaults are used
		// hence it's easier to not render until ready
		this.isDataAvailable = true;
		this._changeRef.detectChanges();
	}

	private _calcHeightWidth(): void {
		if (this.isSquareChart) {
			let size = Math.min(this.container.nativeElement.parentElement.parentElement.offsetHeight, this.container.nativeElement.parentElement.parentElement.offsetWidth);
			this.width = size;
			this.height = size;
		} else {
			this.width = this.container.nativeElement.parentElement.parentElement.offsetWidth;
			this.height = this.container.nativeElement.parentElement.parentElement.offsetHeight;
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
		return this._rawChartData.map((row) => {
			return self._mapRowToDataSet(row);
		});
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
	}

	public get chartType(): ChartType {
		return this._chartType;
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