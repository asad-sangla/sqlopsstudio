/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Component, Input } from '@angular/core';

@Component({
	selector: 'tab',
	template: `
		<div *ngIf="active" class="fullsize">
			<ng-content class="body fullsize"></ng-content>
		</div>
	`
})
export class TabComponent {
	@Input() public title: string;
	public active = false;
	@Input() public identifier: string;
}
