/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditDataComponent } from 'sql/parts/grid/views/editdata.component';
import { SlickGrid } from 'angular2-slickgrid';

declare let AngularPlatformBrowser;
declare let AngularCore;

@AngularCore.NgModule({
	imports: [AngularPlatformBrowser.BrowserModule],
	declarations: [EditDataComponent, SlickGrid],
	bootstrap: [EditDataComponent]
})
export class AppModule { }
