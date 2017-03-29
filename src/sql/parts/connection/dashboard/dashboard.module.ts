/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ModuleWithProviders} from '@angular/core';
import { Routes } from '@angular/router';
import { AppComponent } from './dashboard.component';
import { ConnectionProfileComponent } from './database/connection-profile.component';
import { SchemaExplorerComponent } from './database/schema-explorer.component';
import { DatabaseExplorerComponent } from './server/database-explorer.component';
import { ObjectMetadataExplorerComponent } from './object/objectmetadata-explorer.component';
import { DatabaseDashboardComponent } from './database/database-dashboard.component';
import { ServerDashboardComponent } from './server/server-dashboard.component';
import { ObjectDashboardComponent } from './object/object-dashboard.component';
import { ServerCommandWindowComponent } from './server/server-command-window.component';
import { ServerPropertiesWindowComponent } from './server/server-properties-window.component';
import { DatabaseCommandWindowComponent } from './database/database-command-window.component';
import { DatabasePropertiesWindowComponent } from './database/database-properties-window.component';



declare let AngularPlatformBrowser;
declare let AngularCommon;
declare let AngularCore;
declare let AngularRouter;
declare let PrimeNg;

// Setup routes for various child components
const appRoutes: Routes = [
  { path: 'database-dashboard', component: DatabaseDashboardComponent },
  { path: 'server-dashboard', component: ServerDashboardComponent },
  { path: 'object-dashboard', component: ObjectDashboardComponent },
  { path: '',
    redirectTo: '/database-dashboard',
    pathMatch: 'full'
  },
  { path: '**', component: DatabaseDashboardComponent },
];

// Connection Dashboard main angular module
@AngularCore.NgModule({
  declarations: [
    AppComponent,
    ConnectionProfileComponent,
    SchemaExplorerComponent,
    ServerDashboardComponent,
    ServerCommandWindowComponent,
    ServerPropertiesWindowComponent,
    DatabaseDashboardComponent,
    DatabaseCommandWindowComponent,
    DatabasePropertiesWindowComponent,
    DatabaseExplorerComponent,
    ObjectMetadataExplorerComponent,
    ObjectDashboardComponent
  ],
  imports: [
    AngularPlatformBrowser.BrowserModule,
    PrimeNg.ButtonModule,
    PrimeNg.DataTableModule,
    PrimeNg.SharedModule,
    PrimeNg.ButtonModule,
    PrimeNg.DropdownModule,
    PrimeNg.MessagesModule,
    PrimeNg.DataListModule,
    PrimeNg.BreadcrumbModule,
    <ModuleWithProviders>AngularRouter.RouterModule.forRoot(appRoutes)
  ],
  providers: [{provide: AngularCommon.APP_BASE_HREF, useValue : '/' }],
  bootstrap: [AppComponent]
})
export class DashboardModule { }
