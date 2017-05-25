/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Inject, NgModule, forwardRef, ApplicationRef, ComponentFactoryResolver, ModuleWithProviders } from '@angular/core';
import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule, DataTableModule, SharedModule, DropdownModule, MessagesModule, DataListModule,
	BreadcrumbModule } from 'primeng/primeng';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { DashboardComponent, DASHBOARD_SELECTOR } from 'sql/parts/dashboard/dashboard.component';
import { SchemaExplorerComponent } from 'sql/parts/dashboard/database/schema-explorer.component';
import { DatabaseExplorerComponent } from 'sql/parts/dashboard/server/database-explorer.component';
import { ObjectMetadataExplorerComponent } from 'sql/parts/dashboard/object/objectmetadata-explorer.component';
import { DatabaseDashboardComponent } from 'sql/parts/dashboard/database/database-dashboard.component';
import { ServerDashboardComponent } from 'sql/parts/dashboard/server/server-dashboard.component';
import { ObjectDashboardComponent } from 'sql/parts/dashboard/object/object-dashboard.component';
import { ServerPropertiesWindowComponent } from 'sql/parts/dashboard/server/server-properties-window.component';
import { DatabasePropertiesWindowComponent } from 'sql/parts/dashboard/database/database-properties-window.component';

// Setup routes for various child components
const appRoutes: Routes = [
	{ path: 'database-dashboard', component: DatabaseDashboardComponent },
	{ path: 'server-dashboard', component: ServerDashboardComponent },
	{ path: 'object-dashboard', component: ObjectDashboardComponent },
	{
		path: '',
		redirectTo: '/database-dashboard',
		pathMatch: 'full'
	},
	{ path: '**', component: DatabaseDashboardComponent }
];

// Connection Dashboard main angular module
@NgModule({
	declarations: [
		DashboardComponent,
		SchemaExplorerComponent,
		ServerDashboardComponent,
		ServerPropertiesWindowComponent,
		DatabaseDashboardComponent,
		DatabasePropertiesWindowComponent,
		DatabaseExplorerComponent,
		ObjectMetadataExplorerComponent,
		ObjectDashboardComponent
	],
	entryComponents: [DashboardComponent],
	imports: [
		CommonModule,
		BrowserModule,
		ButtonModule,
		DataTableModule,
		SharedModule,
		DropdownModule,
		MessagesModule,
		DataListModule,
		BreadcrumbModule,
		<ModuleWithProviders>RouterModule.forRoot(appRoutes)
	],
	providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
})
export class DashboardModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(DashboardComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(DASHBOARD_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
