/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { OnInit } from '@angular/core';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ServerProperties } from 'sql/parts/connection/dashboard/server/server-properties';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

@AngularCore.Component({
  selector: 'server-properties-window',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/server/server-properties-window.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})


export class ServerPropertiesWindowComponent implements OnInit {

  @AngularCore.Input() public connection: ConnectionManagementInfo;

  properties: ServerProperties[];

  constructor() {
  }

  ngOnInit() {
    this.properties = [];
    this.properties.push(new ServerProperties("Name", "SQLTOOLS2016"));
    this.properties.push(new ServerProperties("Product", "Microsoft SQL Server Enterprise (64-bit)"));
    this.properties.push(new ServerProperties("Operating System", "Microsoft Windows NT 6.3 (9600)"));
    this.properties.push(new ServerProperties("Platform", "NT x64"));
    this.properties.push(new ServerProperties("Version", "13.0.1722.0"));
    this.properties.push(new ServerProperties("Language", "English (United States)"));
    this.properties.push(new ServerProperties("Memory", "16381 MB"));
    this.properties.push(new ServerProperties("Processions", "4"));
    this.properties.push(new ServerProperties("Root Directory", "C:\\Program Files\\Microsoft SQL Server\\MSSQL13.MSSQLSERVER\\MSSQL"));
    this.properties.push(new ServerProperties("Server Collation", "SQL_Latin1_General_CP1_CI_AS"));
    this.properties.push(new ServerProperties("Is Clustered", "False"));
    this.properties.push(new ServerProperties("Is HADR Enabled", "False"));
    this.properties.push(new ServerProperties("Is XTP Supported", "True"));
    this.properties.push(new ServerProperties("Is PolyBase Installed", "True"));
  }

}
