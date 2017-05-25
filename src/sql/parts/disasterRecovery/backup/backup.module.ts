/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver, ModuleWithProviders, NgModule,
	Inject, forwardRef } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { ButtonModule, DataTableModule, DropdownModule, SharedModule, MessagesModule,
	DataListModule, BreadcrumbModule } from 'primeng/primeng';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { BackupComponent, BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';

// Backup wizard main angular module
@NgModule({
	declarations: [
		BackupComponent
	],
	entryComponents: [BackupComponent],
	imports: [
		CommonModule,
		BrowserModule,
		ButtonModule,
		DataTableModule,
		SharedModule,
		DropdownModule,
		MessagesModule,
		DataListModule,
		BreadcrumbModule
	],
	providers: [{ provide: APP_BASE_HREF, useValue: '/' }]
})
export class BackupModule {

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(BackupComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(BACKUP_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
