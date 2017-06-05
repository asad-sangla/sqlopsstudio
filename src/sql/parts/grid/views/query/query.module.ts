/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver, forwardRef, NgModule,
	Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { QueryComponent, QUERY_SELECTOR } from 'sql/parts/grid/views/query/query.component';
import { SlickGrid } from 'angular2-slickgrid';
import { MouseDownDirective } from 'sql/parts/grid/directives/mousedown.directive';
import { ScrollDirective } from 'sql/parts/grid/directives/scroll.directive';

@NgModule({

	imports: [
		CommonModule,
		BrowserModule
	],

	declarations: [
		QueryComponent,
		SlickGrid,
		ScrollDirective,
		MouseDownDirective
	],

	entryComponents: [
		QueryComponent
	]
})
export class QueryModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(QueryComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(QUERY_SELECTOR);
		(<any>factory).factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}