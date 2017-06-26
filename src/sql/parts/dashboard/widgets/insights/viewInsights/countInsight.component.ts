/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Component, Input, OnChanges, SimpleChanges, Inject, ChangeDetectorRef, forwardRef } from '@angular/core';

import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { InsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import * as colors from 'vs/platform/theme/common/colorRegistry';

import { SimpleExecuteResult } from 'data';

@Component({
	template: `	<div style="display: block">
				<canvas baseChart
						[data]="chartData"
						[labels]="labels"
						chartType="pie"
						[colors]="colors"
						[options]="options"></canvas>
				</div>`
})
export class CountInsight implements InsightsView, OnChanges {
	private _data: SimpleExecuteResult;
	private _colorMap: {[column: string]: string};
	private labels: string[] = [];
	private chartData: number[] = [];
	private colors: any[] = [];
	private options: any = {};

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) {}

	ngOnChanges(changes: SimpleChanges) {
		console.log(changes);
	}

	@Input() set data(data: SimpleExecuteResult) {
		this._data = data;
		this.labels = [];
		data.columnInfo.forEach((item) => {
			this.labels.push(item.columnName);
		});
		this.chartData = [];
		data.rows[0].forEach((item) => {
			this.chartData.push(Number(item.displayValue));
		});
		this._changeRef.detectChanges();
	}

	@Input() set colorMap(map: {[column: string]: string}) {
		this._colorMap = map;
		let colorsMap = {backgroundColor: []};
		this.labels.forEach((item) => {
			colorsMap.backgroundColor.push(map[item]);
		});
		this.colors = [colorsMap];
		let options = {
			legend: {
				labels: {
					fontColor: this._bootstrap.themeService.getColorTheme().getColor(colors.editorForeground)
				}
			}
		};
		this.options = options;
		this._changeRef.detectChanges();
	}
}