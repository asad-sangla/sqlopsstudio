/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AppComponent } from './dashboard.component';
import { ConnectionProfileComponent } from './connection-profile/connection-profile.component';
import { SchemaExplorerComponent } from './schema-explorer/schema-explorer.component';
import { ServerCommandWindowComponent } from './server/server-command-window.component';

declare let AngularPlatformBrowser;
declare let AngularCore;
declare let PrimeNg;

// Connection Dashboard main angular module
@AngularCore.NgModule({
  declarations: [
    AppComponent,
    ConnectionProfileComponent,
    SchemaExplorerComponent,
    ServerCommandWindowComponent
  ],
  imports: [
    AngularPlatformBrowser.BrowserModule,
    PrimeNg.ButtonModule,
    PrimeNg.DataTableModule,
    PrimeNg.SharedModule,
    PrimeNg.ButtonModule,
    PrimeNg.DropdownModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class DashboardModule { }
