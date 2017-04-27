/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApplicationRef, ComponentFactoryResolver } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';

import { DbListComponent, DBLIST_SELECTOR } from 'sql/parts/common/dblist/dblist.component';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let AngularCommon;
declare let AngularForms;
declare let PrimeNg;

@AngularCore.NgModule({

	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule,
		AngularForms.FormsModule,
		PrimeNg.DropdownModule
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
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(DbListComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(DBLIST_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}