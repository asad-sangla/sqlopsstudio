/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


import { ApplicationRef, ComponentFactoryResolver } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';

import { EditDataComponent, EDITDATA_SELECTOR } from 'sql/parts/grid/views/editData/editData.component';
import { SlickGrid } from 'angular2-slickgrid';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let AngularCommon;

@AngularCore.NgModule({

	imports: [
		AngularCommon.CommonModule,
		AngularPlatformBrowser.BrowserModule
	],

	declarations: [
		EditDataComponent,
		SlickGrid
	],

	entryComponents: [
		EditDataComponent
	]
})
export class EditDataModule {

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ComponentFactoryResolver)) private _resolver: ComponentFactoryResolver,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
	}

	ngDoBootstrap(appRef: ApplicationRef) {
		const factory = this._resolver.resolveComponentFactory(EditDataComponent);
		const uniqueSelector: string = this._bootstrapService.getUniqueSelector(EDITDATA_SELECTOR);
		factory.selector = uniqueSelector;
		appRef.bootstrap(factory);
	}
}
