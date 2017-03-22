/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AppComponent } from './dashboard.component';
import { ConnectionProfileComponent } from './connection-profile/connection-profile.component';
import { SchemaExplorerComponent } from './schema-explorer/schema-explorer.component';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let PrimeNg;

// Connection Dashboard main angular module
@AngularCore.NgModule({
  declarations: [
    AppComponent,
    ConnectionProfileComponent,
    SchemaExplorerComponent
  ],
  imports: [
    AngularPlatformBrowser.BrowserModule,
    PrimeNg.DataTableModule,
    PrimeNg.SharedModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class DashboardModule { }
