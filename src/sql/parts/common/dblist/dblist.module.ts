/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver, NgModule, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { DropdownModule } from 'primeng/primeng';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { DbListComponent, DBLIST_SELECTOR } from 'sql/parts/common/dblist/dblist.component';

@NgModule({

	imports: [
		CommonModule,
		BrowserModule,
		FormsModule,
		DropdownModule
	],

	declarations: [
		DbListComponent
	],

	entryComponents: [
		DbListComponent
	]
})
export class DbListModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(DbListComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(DBLIST_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}