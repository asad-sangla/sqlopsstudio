/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!./media/breadcrumb';

import { Component, Inject, forwardRef, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';
import { IBreadcrumbService, MenuItem } from './interfaces';

import { IDisposable } from 'vs/base/common/lifecycle';

@Component({
	selector: 'breadcrumb',
	template: `
				<span style="display: flex; flex-flow: row; align-items: center">
					<ng-template ngFor let-item let-last="last" [ngForOf]="menuItems">
						<span style="padding: 5px; display: flex; align-items: center">
							<span *ngIf="item.icon" class="icon" style="display: inline-block; margin-right: 5px" [ngClass]="item.icon"></span>
							<span *ngIf="last" style="">{{item.label}}</span>
							<a class="router-link" *ngIf="!last" (click)="route(item.routerLink)">{{item.label}}</a>
						</span>
						<span *ngIf="!last" class="icon chevron-right"></span>
					</ng-template>
				</span>
				`
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
	private menuItems: MenuItem[] = [];
	private disposables: Array<IDisposable> = new Array();

	constructor(
		@Inject(forwardRef(() => IBreadcrumbService)) private _breadcrumbService: IBreadcrumbService,
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

	public route(link: any[]): void {
		this._router.navigate(link);
	}
}
