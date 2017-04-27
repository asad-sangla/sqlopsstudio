/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { CreateLoginComponent, CREATELOGIN_SELECTOR } from 'sql/parts/admin/security/createLogin.component';

declare let AngularPlatformBrowser;
declare let AngularCommon;
declare let AngularCore;
declare let AngularRouter;
declare let PrimeNg;

// Connection Dashboard main angular module
@AngularCore.NgModule({
	declarations: [
		CreateLoginComponent
	],
	entryComponents: [CreateLoginComponent],
	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule
	],
	providers: [{ provide: AngularCommon.APP_BASE_HREF, useValue: '/' }]
})
export class CreateLoginModule {

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(CreateLoginComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(CREATELOGIN_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
