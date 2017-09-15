/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';

/* SQL Imports */
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import * as TelemetryKeys from 'sql/common/telemetryKeys';
import * as TelemetryUtils from 'sql/common/telemetryUtilities';
import { IInsightsView, IInsightData } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { memoize, unmemoize } from 'sql/common/decorators';

/* VS Imports */
import * as colors from 'vs/platform/theme/common/colorRegistry';
import { mixin } from 'sql/base/common/objects';
import { Color } from 'vs/base/common/color';
import * as types from 'vs/base/common/types';
import { IDisposable } from 'vs/base/common/lifecycle';
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';

export enum ChartType {
	Bar = 'bar',
	Doughnut = 'doughnut',
	HorizontalBar = 'horizontalBar',
	Line = 'line',
	Pie = 'pie',
	TimeSeries = 'timeSeries',
	Scatter = 'scatter'
}

export enum DataDirection {
	Vertical = 'vertical',
	Horizontal = 'horizontal'
}

export enum LegendPosition {
	Top = 'top',
	Bottom = 'bottom',
	Left = 'left',
	Right = 'right',
	None =  'none'
}

export function customMixin(destination: any, source: any, overwrite?: boolean): any {
	if (types.isObject(source)) {
		mixin(destination, source, overwrite, customMixin);
	} else if (types.isArray(source)) {
		for (let i = 0; i < source.length; i++) {
			if (destination[i]) {
				mixin(destination[i], source[i], overwrite, customMixin);
			} else {
				destination[i] = source[i];
			}
		}
	} else {
		destination = source;
	}
	return destination;
}

export interface IDataSet {
	data: Array<number>;
	label?: string;
}

export interface IPointDataSet {
	data: Array<{ x: number | string, y: number }>;
	label?: string;
	fill: boolean;
	backgroundColor?: Color;
}

export interface IChartConfig {
	colorMap?: { [column: string]: string };
	labelFirstColumn?: boolean;
	legendPosition?: LegendPosition;
	dataDirection?: DataDirection;
	columnsAsLabels?: boolean;
}

export const defaultChartConfig: IChartConfig = {
	labelFirstColumn: false,
	columnsAsLabels: false,
	legendPosition: LegendPosition.Top,
	dataDirection: DataDirection.Vertical
};

@Component({
	template: `	<div style="display: block; width: 100%; height: 100%; position: relative">
					<canvas #canvas *ngIf="_isDataAvailable"
							baseChart
							[datasets]="chartData"
							[labels]="labels"
							[chartType]="chartType"
							[colors]="colors"
							[options]="_options"></canvas>
				</div>`
})
export abstract class ChartInsight implements IInsightsView, OnDestroy {
	private _isDataAvailable: boolean = false;
	private _options: any = {};

	@ViewChild(BaseChartDirective) private _chart: BaseChartDirective;
	@ViewChild('canvas', {read: ElementRef}) private _canvas: ElementRef;

	protected _defaultConfig = defaultChartConfig;
	protected _disposables: Array<IDisposable> = [];
	protected _config: IChartConfig;
	protected _data: IInsightData;

	protected abstract get chartType(): ChartType;


	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(BOOTSTRAP_SERVICE_ID) protected _bootstrapService: IBootstrapService) { }

	ngOnDestroy() {
		this._disposables.forEach(item => item.dispose());
	}

	init() {
		this._disposables.push(this._bootstrapService.themeService.onDidColorThemeChange(e => this.updateTheme(e)));
		this.updateTheme(this._bootstrapService.themeService.getColorTheme());
		// Note: must use a boolean to not render the canvas until all properties such as the labels and chart type are set.
		// This is because chart.js doesn't auto-update anything other than dataset when re-rendering so defaults are used
		// hence it's easier to not render until ready
		this.options = mixin(this.options, { maintainAspectRatio: false });
		this._isDataAvailable = true;
		this._changeRef.detectChanges();
		TelemetryUtils.addTelemetry(this._bootstrapService.telemetryService, TelemetryKeys.ChartCreated, { type: this.chartType });
	}

	/**
	 * Sets the options for the chart; handles rerendering the chart if needed
	 */
	public set options(options: any) {
		this._options = options;
		if (this._isDataAvailable) {
			this._options = mixin({}, mixin(this._options, { animation: { duration: 0 } }));
			this.refresh();
		}
	}

	public get options(): any {
		return this._options;
	}

	protected updateTheme(e: IColorTheme): void {
		let options = {
			legend: {
				labels: {
					fontColor: e.getColor(colors.editorForeground)
				}
			}
		};
		this.options = mixin({}, mixin(this.options, options));
	}

	public refresh() {
		// cheaper refresh but causes problems when change data for rerender
		this._chart.ngOnChanges({});
	}

	public getCanvasData(format?: string): any {
		if (!format) {
			format = 'png';
		}

		if (this._canvas) {
			let canvasElement = <HTMLCanvasElement>$(this._canvas.nativeElement).get(0);
			let canvasData = canvasElement.toDataURL('image/' + format);
			return canvasData;
		}
		return undefined;
	}

	@Input() set data(data: IInsightData) {
		// unmemoize chart data as the data needs to be recalced
		unmemoize(this, 'chartData');
		unmemoize(this, 'labels');
		this._data = data;

		this._changeRef.detectChanges();
	}

	protected clearMemoize(): void {
		// unmemoize getters since their result can be changed by a new config
		unmemoize(this, 'getChartData');
		unmemoize(this, 'getLabels');
		unmemoize(this, 'colors');
	}

	@Input() set config(config: IChartConfig) {
		this.clearMemoize();
		this._config = mixin(config, this._defaultConfig, false);
		this.legendPosition = this._config.legendPosition;
		if (this._isDataAvailable) {
			this._options = mixin({}, mixin(this._options, { animation: false }));
			this.refresh();
		}
	}

	/* Typescript does not allow you to access getters/setters for super classes.
	   This is a workaround that allows us to still call base getter */
	@memoize
	protected getChartData(): Array<IDataSet> {
		if (this._config.dataDirection === 'horizontal') {
			if (this._config.labelFirstColumn) {
				return this._data.rows.map((row) => {
					return {
						data: row.map(item => Number(item)).slice(1),
						label: row[0]
					};
				});
			} else {
				return this._data.rows.map((row, i) => {
					return {
						data: row.map(item => Number(item)),
						label: 'Series' + i
					};
				});
			}
		} else {
			if (this._config.columnsAsLabels) {
				return this._data.rows[0].map((row, i) => {
					return {
						data: this._data.rows.map(row => Number(row[i])),
						label: this._data.columns[i]
					};
				}).slice(1);
			} else {
				return this._data.rows[0].map((row, i) => {
					return {
						data: this._data.rows.map(row => Number(row[i])),
						label: 'Series' + i
					};
				}).slice(1);
			}
		}
	}

	public get chartData(): Array<IDataSet | IPointDataSet> {
		return this.getChartData();
	}

	@memoize
	public getLabels(): Array<string> {
		if (this._config.dataDirection === 'horizontal') {
			return this._data.columns;
		} else {
			return this._data.rows.map(row => row[0]);
		}
	}

	public get labels(): Array<string> {
		return this.getLabels();
	}


	@memoize
	private get colors(): { backgroundColor: string[] }[] {
		if (this._config && this._config.colorMap) {
			let backgroundColor = this.labels.map((item) => {
				return this._config.colorMap[item];
			});
			let colorsMap = { backgroundColor };
			return [colorsMap];
		} else {
			return undefined;
		}
	}

	public set legendPosition(input: LegendPosition) {
		let options = {
			legend: {
				display: true,
				position: 'top'
			}
		};
		if (input === 'none') {
			options.legend.display = false;
		} else {
			options.legend.position = input;
		}
		this.options = mixin(this.options, options);
	}
}