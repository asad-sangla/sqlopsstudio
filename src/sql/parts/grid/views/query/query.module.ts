/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';

import { QueryComponent, QUERY_SELECTOR } from 'sql/parts/grid/views/query/query.component';
import { SlickGrid } from 'angular2-slickgrid';
import { MouseDownDirective } from 'sql/parts/grid/directives/mousedown.directive';
import { ScrollDirective } from 'sql/parts/grid/directives/scroll.directive';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let AngularCommon;

@AngularCore.NgModule({

	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule
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
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(QueryComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(QUERY_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}