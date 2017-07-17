/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef } from '@angular/core';


import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IInsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

@Component({
	template: `
		<div style="margin-left: 5px" *ngFor="let label of _labels; let i = index">
			<span style="font-size: 20px">{{_values[i]}}  </span>
			<span>{{_labels[i]}}</span>
		</div>
	`
})
export class CountInsight implements IInsightsView {
	public readonly customFields = [];
	private _labels: Array<string>;
	private _values: Array<string>;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) { }

	@Input() set data(data: SimpleExecuteResult) {
		this._labels = [];
		data.columnInfo.forEach((item) => {
			this._labels.push(item.columnName);
		});
		this._values = [];
		data.rows[0].forEach((item) => {
			this._values.push(item.displayValue);
		});
		this._changeRef.detectChanges();
	}
}