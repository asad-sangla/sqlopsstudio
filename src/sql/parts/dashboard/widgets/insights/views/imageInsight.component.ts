/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, ChangeDetectorRef, forwardRef , ViewChild, OnInit, ElementRef } from '@angular/core';


import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IInsightsView } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { SimpleExecuteResult } from 'data';

@Component({
	template: `
		<div *ngIf="hasData" #container style="display: block">
    		<img #image src="{{source}}" >
		</div>
	`
})
export class ImageInsight implements IInsightsView, OnInit {
	public readonly customFields = ['imageFormat', 'encoding'];
	private _rawSource: string;
	private _format: string = 'jpeg';
	private _encoding: string = 'hex';
	@ViewChild('image') private image: ElementRef;
	@ViewChild('container') private container: ElementRef;

	constructor(
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface) { }

	ngOnInit() {
		let size = Math.min(this.container.nativeElement.parentElement.parentElement.offsetHeight, this.container.nativeElement.parentElement.parentElement.offsetWidth);
		this.image.nativeElement.style.width = size + 'px';
		this.image.nativeElement.style.height = size + 'px';
	}

	@Input() set imageFormat(format: string) {
		if (format) {
			this._format = format;
		} else {
			this._format = 'jpeg';
		}
		this._changeRef.detectChanges();
	}

	@Input() set encoding(encoding: string) {
		if (encoding) {
			this.encoding = encoding;
		} else {
			this._encoding = 'hex';
		}
		this._changeRef.detectChanges();
	}

	@Input() set data(data: SimpleExecuteResult) {
		let self = this;
		if (data.rows && data.rows.length > 0 && data.rows[0].length > 0) {
			let item = data.rows[0][0];
			self._rawSource = item.displayValue;
		} else {
			this._rawSource = '';
		}
		this._changeRef.detectChanges();
	}

	public get hasData(): boolean {
		return this._rawSource && this._rawSource !== '';
	}

	public get source(): string {
		let img = this._rawSource;
		if (this._encoding === 'hex') {
			img = ImageInsight._hexToBase64(img);
		}
		return `data:image/${this._format};base64,${img}`;
	}

	private static _hexToBase64(hexVal: string) {

		if (hexVal.startsWith('0x')) {
			hexVal = hexVal.slice(2);
		}
		return btoa(String.fromCharCode.apply(null, hexVal.replace(/\r|\n/g, '').replace(/([\da-fA-F]{2}) ?/g, '0x$1 ').replace(/ +$/, '').split(' ')));
	}

}