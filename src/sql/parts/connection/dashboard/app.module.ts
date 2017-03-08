/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AppComponent } from './app.component';
import { ConnectionProfileComponent } from './connection-profile/connection-profile.component';
import { SchemaExplorerComponent } from './schema-explorer/schema-explorer.component';

declare let AngularPlatformBrowser;
declare let AngularCore;

// Connection Dashboard main angular module
@AngularCore.NgModule({
  declarations: [
    AppComponent,
    ConnectionProfileComponent,
    SchemaExplorerComponent
  ],
  imports: [ AngularPlatformBrowser.BrowserModule ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
