/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef } from '@angular/core';

import { IInsightsView, IInsightData } from 'sql/parts/dashboard/widgets/insights/interfaces';

@Component({
	template: `
		<div style="margin-left: 5px" *ngFor="let label of _labels; let i = index">
			<span style="font-size: 20px">{{_values[i]}}  </span>
			<span>{{_labels[i]}}</span>
		</div>
	`
})
export default class CountInsight implements IInsightsView {
	private _labels: Array<string>;
	private _values: Array<string>;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef) { }

	@Input() set data(data: IInsightData) {
		this._labels = [];
		this._labels = data.columns;
		this._values = data.rows[0];
		this._changeRef.detectChanges();
	}
}
