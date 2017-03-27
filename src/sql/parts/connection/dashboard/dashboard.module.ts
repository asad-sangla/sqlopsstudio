/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ModuleWithProviders} from '@angular/core';
import { Routes } from '@angular/router';
import { AppComponent } from './dashboard.component';
import { ConnectionProfileComponent } from './connection-profile/connection-profile.component';
import { SchemaExplorerComponent } from './schema-explorer/schema-explorer.component';
import { ServerPropsWindowComponent } from './server-dashboard/props-window/props-window.component';
import { DatabaseDashboardComponent } from './database-dashboard/database-dashboard.component';
import { ServerDashboardComponent } from './server-dashboard/server-dashboard.component';
import { ServerProfileComponent } from './server-dashboard/server-profile/server-profile.component';
import { ServerCommandWindowComponent } from './server-dashboard/command-window/command-window.component';

declare let AngularPlatformBrowser;
declare let AngularCommon;
declare let AngularCore;
declare let AngularRouter;
declare let PrimeNg;

// Setup routes for various child components
const appRoutes: Routes = [
  { path: 'database-dashboard', component: DatabaseDashboardComponent },
  { path: 'server-dashboard', component: ServerDashboardComponent },
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
    ServerPropsWindowComponent,
    DatabaseDashboardComponent,
    ServerProfileComponent
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
