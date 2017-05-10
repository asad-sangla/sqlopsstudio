/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Routes } from '@angular/router';
import { ApplicationRef, ComponentFactoryResolver, ModuleWithProviders } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { TaskDialogComponent, TASKDIALOG_SELECTOR } from 'sql/parts/tasks/dialog/taskDialog.component';
import { CreateDatabaseComponent } from 'sql/parts/admin/database/create/createDatabase.component';

declare let AngularPlatformBrowser;
declare let AngularCommon;
declare let AngularCore;
declare let AngularRouter;
declare let PrimeNg;

// Setup routes for various child components
const appRoutes: Routes = [
	{ path: 'create-database', component: CreateDatabaseComponent },
	{
		path: '',
		redirectTo: '/create-database',
		pathMatch: 'full'
	},
	{ path: '**', component: CreateDatabaseComponent }
];


@AngularCore.NgModule({
	declarations: [
		TaskDialogComponent,
		CreateDatabaseComponent
	],
	entryComponents: [TaskDialogComponent],
	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule,
		PrimeNg.DataTableModule,
		<ModuleWithProviders>AngularRouter.RouterModule.forRoot(appRoutes)
	],
	providers: [{ provide: AngularCommon.APP_BASE_HREF, useValue: '/' }]
})
export class TaskDialogModule {

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(TaskDialogComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(TASKDIALOG_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
