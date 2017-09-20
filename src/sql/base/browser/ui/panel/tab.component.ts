/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input, ContentChild } from '@angular/core';

export abstract class TabChild {
	public abstract layout(): void;
}

@Component({
	selector: 'tab',
	template: `
		<div *ngIf="active" class="fullsize">
			<ng-content class="body fullsize"></ng-content>
		</div>
	`
})
export class TabComponent {
	@ContentChild(TabChild) private _child: TabChild;
	@Input() public title: string;
	public _active = false;
	@Input() public identifier: string;

	public set active(val: boolean) {
		this._active = val;
		if (this.active && this._child) {
			this._child.layout();
		}
	}

	public get active(): boolean {
		return this._active;
	}
}
