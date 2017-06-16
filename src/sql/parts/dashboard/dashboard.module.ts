/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Inject, NgModule, forwardRef, ApplicationRef, ComponentFactoryResolver } from '@angular/core';
import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes, UrlSerializer } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgGridModule } from 'angular4-grid';
import { BreadcrumbModule } from 'primeng/primeng';

import CustomUrlSerializer from 'sql/common/urlSerializer';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
/* Services */
import { BreadcrumbService } from 'sql/parts/dashboard/services/breadcrumb.service';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
/* Directives */
import { WidgetDirective } from 'sql/parts/dashboard/common/widget.directive';
/* Base Components */
import { DashboardComponent, DASHBOARD_SELECTOR } from 'sql/parts/dashboard/dashboard.component';
import { DatabaseDashboardPage } from 'sql/parts/dashboard/pages/databaseDashboardPage.component';
import { ServerDashboardPage } from 'sql/parts/dashboard/pages/serverDashboardPage.component';
import { DashboardWidgetWrapper } from 'sql/parts/dashboard/common/dashboardWidgetWrapper.component';
import { DashboardPage } from 'sql/parts/dashboard/common/dashboardPage.component';
/* Widget Components */
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ExplorerWidget } from 'sql/parts/dashboard/widgets/explorer/explorerWidget.component';
import { ExplorerFilter } from 'sql/parts/dashboard/widgets/explorer/explorerFilter.pipe';
import { TasksWidget } from 'sql/parts/dashboard/widgets/tasks/tasksWidget.component';
import { TaskPipe} from 'sql/parts/dashboard/widgets/tasks/tasksPipe.pipe';

// Setup routes for various child components
const appRoutes: Routes = [
	{ path: 'database-dashboard', component: DatabaseDashboardPage },
	{ path: 'server-dashboard', component: ServerDashboardPage },
	{
		path: '',
		redirectTo: '/database-dashboard',
		pathMatch: 'full'
	},
	{ path: '**', component: DatabaseDashboardPage }
];

// Connection Dashboard main angular module
@NgModule({
	declarations: [
		DashboardComponent,
		DashboardWidgetWrapper,
		ServerDashboardPage,
		DatabaseDashboardPage,
		WidgetDirective,
		ExplorerWidget,
		ExplorerFilter,
		TasksWidget,
		TaskPipe,
		PropertiesWidgetComponent,
		DashboardPage
	],
	// also for widgets
	entryComponents: [
		DashboardComponent,
		PropertiesWidgetComponent,
		ExplorerWidget,
		TasksWidget
	],
	imports: [
		CommonModule,
		BrowserModule,
		FormsModule,
		BreadcrumbModule,
		NgGridModule,
		RouterModule.forRoot(appRoutes)
	],
	providers: [
		{ provide: APP_BASE_HREF, useValue: '/' },
		BreadcrumbService,
		DashboardServiceInterface,
		{ provide: UrlSerializer, useClass: CustomUrlSerializer }
	]
})
export class DashboardModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(DashboardComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(DASHBOARD_SELECTOR);
		this._bootstrap.selector = uniqueSelector;
		(<any>factory).factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
