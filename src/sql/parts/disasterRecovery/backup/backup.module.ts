/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver, ModuleWithProviders } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { BackupComponent, BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';

declare let AngularPlatformBrowser;
declare let AngularCommon;
declare let AngularCore;
declare let AngularRouter;
declare let PrimeNg;

// Backup wizard main angular module
@AngularCore.NgModule({
	declarations: [
		BackupComponent
	],
	entryComponents: [BackupComponent],
	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule,
		PrimeNg.ButtonModule,
		PrimeNg.DataTableModule,
		PrimeNg.SharedModule,
		PrimeNg.DropdownModule,
		PrimeNg.MessagesModule,
		PrimeNg.DataListModule,
		PrimeNg.BreadcrumbModule
	],
	providers: [{ provide: AngularCommon.APP_BASE_HREF, useValue: '/' }]
})
export class BackupModule {

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(BackupComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(BACKUP_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
