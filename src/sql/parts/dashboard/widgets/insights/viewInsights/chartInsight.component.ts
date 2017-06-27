/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef } from '@angular/core';

/* SQL Imports */
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { InsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

/* VS Imports */
import * as colors from 'vs/platform/theme/common/colorRegistry';

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
export class ChartInsight implements InsightsView {
	public readonly customFields = ['colorMap'];
	private _data: SimpleExecuteResult;
	private _labels: string[] = [];
	private _chartData: number[] = [];
	private _colors: any[] = [];
	private _options: any = {};

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) { }

	@Input() set data(data: SimpleExecuteResult) {
		this._data = data;
		this._labels = [];
		data.columnInfo.forEach((item) => {
			this._labels.push(item.columnName);
		});
		this._chartData = [];
		data.rows[0].forEach((item) => {
			this._chartData.push(Number(item.displayValue));
		});
		this._changeRef.detectChanges();
	}

	@Input() set colorMap(map: { [column: string]: string }) {
		let colorsMap = { backgroundColor: [] };
		this._labels.forEach((item) => {
			colorsMap.backgroundColor.push(map[item]);
		});
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