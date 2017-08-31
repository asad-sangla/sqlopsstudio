/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/


import { ApplicationRef, ComponentFactoryResolver, forwardRef, NgModule, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SlickGrid } from 'angular2-slickgrid';
import { ChartsModule } from 'ng2-charts/ng2-charts';

const BrowserAnimationsModule = (<any>require.__$__nodeRequire('@angular/platform-browser/animations')).BrowserAnimationsModule;

import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { Extensions, IInsightRegistry } from 'sql/platform/dashboard/common/insightRegistry';

import { Registry } from 'vs/platform/registry/common/platform';


import { QueryOutputComponent, QUERY_OUTPUT_SELECTOR } from 'sql/parts/query/views/queryOutput.component';
import { QueryPlanComponent, } from 'sql/parts/queryPlan/queryPlan.component';
import { QueryComponent } from 'sql/parts/grid/views/query/query.component';
import { TopOperationsComponent } from 'sql/parts/queryPlan/topOperations.component';

import { ChartViewerComponent } from 'sql/parts/grid/views/query/chartViewer.component';

import { PanelModule } from 'sql/base/browser/ui/panel/panel.module';

/* Directives */
import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { MouseDownDirective } from 'sql/parts/grid/directives/mousedown.directive';
import { ScrollDirective } from 'sql/parts/grid/directives/scroll.directive';
import { ButtonModule, DropdownModule, TabViewModule } from 'primeng/primeng';

let baseComponents = [QueryComponent, ComponentHostDirective, QueryOutputComponent, QueryPlanComponent, TopOperationsComponent, ChartViewerComponent];
/* Insights */
let insightComponents = Registry.as<IInsightRegistry>(Extensions.InsightContribution).getAllCtors();

@NgModule({
	imports: [
		CommonModule,
		BrowserModule,
		FormsModule,
		TabViewModule,
		ButtonModule,
		DropdownModule,
		BrowserAnimationsModule,
		ChartsModule,
		PanelModule
	],
	declarations: [
		...baseComponents,
		...insightComponents,
		SlickGrid,
		ScrollDirective,
		MouseDownDirective
	],
	entryComponents: [
		QueryOutputComponent,
		...insightComponents
	]
})
export class QueryOutputModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(QueryOutputComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(QUERY_OUTPUT_SELECTOR);
		(<any>factory).factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
