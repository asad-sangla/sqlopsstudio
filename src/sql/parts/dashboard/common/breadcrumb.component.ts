/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';
import { Component, Inject, forwardRef, OnInit, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';
import { BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';

import { IDisposable } from 'vs/base/common/lifecycle';

export interface MenuItem {
	label?: string;
	icon?: string;
	command?: (event?: any) => void;
	url?: string;
	routerLink?: any;
	eventEmitter?: EventEmitter<any>;
	items?: MenuItem[];
	expanded?: boolean;
	disabled?: boolean;
	visible?: boolean;
	target?: string;
	routerLinkActiveOptions?: any;
}

@Component({
	selector: 'breadcrumb',
	template: `
				<span style="display: flex; flex-flow: row; align-items: center; padding: 5px">
					<ng-template ngFor let-item let-last="last" [ngForOf]="menuItems">
						<span *ngIf="item.icon" class="icon" style="display: inline-block; padding: 5px; margin-right: 2px" [ngClass]="item.icon"></span>
						<a href="#" style="padding-right: 5px" [routerLink]="item.routerLink">{{item.label}}</a>
						<span *ngIf="!last" class="fa fa-chevron-right" style="padding-right: 5px"></span>
					</ng-template>
				</span>
				`
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
	private menuItems: MenuItem[] = [];
	private disposables: Array<IDisposable> = new Array();
	constructor(
		@Inject(forwardRef(() => BreadcrumbService)) private _breadcrumbService: BreadcrumbService,
		@Inject(forwardRef(() => Router)) private _router: Router,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
	) { }

	ngOnInit() {
		this.disposables.push(toDisposableSubscription(this._breadcrumbService.breadcrumbItem.subscribe((item) => this.updateCrumb(item))));
	}

	ngOnDestroy() {
		this.disposables.forEach(item => item.dispose());
	}

	private updateCrumb(items: MenuItem[]) {
		this.menuItems = items;
		this._changeRef.detectChanges();
	}
}
