/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AppComponent } from 'sql/parts/grid/views/app.component';
import { SlickGrid } from 'angular2-slickgrid';

declare let AngularPlatformBrowser;
declare let AngularCore;

@AngularCore.NgModule({
  imports: [ AngularPlatformBrowser.BrowserModule ],
  declarations: [ AppComponent, SlickGrid ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
