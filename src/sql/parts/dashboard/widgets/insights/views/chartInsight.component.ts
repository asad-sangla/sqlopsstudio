/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef, ViewChild, OnInit, ElementRef } from '@angular/core';

/* SQL Imports */
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IInsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

/* VS Imports */
import * as colors from 'vs/platform/theme/common/colorRegistry';

interface IChartConfig {
	colorMap?: { [column: string]: string };
	legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

@Component({
	template: `	<div #container style="display: block">
					<canvas #chart
							baseChart
							[data]="_chartData"
							[labels]="_labels"
							chartType="pie"
							[colors]="_colors"
							[options]="_options"></canvas>
				</div>`
})
export class ChartInsight implements IInsightsView, OnInit {
	public readonly customFields = ['colorMap', 'legendPosition'];
	private _data: SimpleExecuteResult;
	private _labels: string[] = [];
	private _chartData: number[] = [];
	private _colors: any[] = [];
	private _options: any = {};
	@ViewChild('chart') private chart: ElementRef;
	@ViewChild('container') private container: ElementRef;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) { }

	ngOnInit() {
		let size = Math.min(this.container.nativeElement.parentElement.parentElement.offsetHeight, this.container.nativeElement.parentElement.parentElement.offsetWidth);
		this.chart.nativeElement.style.width = size + 'px';
		this.chart.nativeElement.style.height = size + 'px';
	}

	@Input() set data(data: SimpleExecuteResult) {
		this._data = data;
		this._labels = data.columnInfo.map((item) => {
			return item.columnName;
		});
		this._chartData = data.rows[0].map((item) => {
			return Number(item.displayValue);
		});
		this._changeRef.detectChanges();
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
			this._changeRef.detectChanges();
		}
	}

	@Input() set legendPosition(position: 'top' | 'left' | 'right' | 'bottom' | 'none') {
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
			this._changeRef.detectChanges();
		}
	}
}