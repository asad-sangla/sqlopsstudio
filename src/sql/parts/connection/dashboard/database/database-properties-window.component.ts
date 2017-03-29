/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import { OnInit } from '@angular/core';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { DatabaseProperties } from 'sql/parts/connection/dashboard/database/database-properties';

declare let AngularCore;

@AngularCore.Component({
  selector: 'database-properties-window',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/database/database-properties-window.component.html'),
  styleUrls: [ require.toUrl('sql/parts/connection/dashboard/database/database-properties-window.component.css') ]
})


export class DatabasePropertiesWindowComponent implements OnInit {

  @AngularCore.Input() public connection: IConnectionProfile;

  properties: DatabaseProperties[];

  constructor() {
  }

  ngOnInit() {
    this.properties = [];
    this.properties.push(new DatabaseProperties('Name', 'master'));
    this.properties.push(new DatabaseProperties('Status', 'Normal'));
    this.properties.push(new DatabaseProperties('Owner', 'sa'));
    this.properties.push(new DatabaseProperties('Date Created', '4/8/2003 9:13:36 AM'));
    this.properties.push(new DatabaseProperties('Size', '14.38 MB'));
    this.properties.push(new DatabaseProperties('Space Available', '0.55 MB'));
    this.properties.push(new DatabaseProperties('Number of Users', '10'));
    this.properties.push(new DatabaseProperties('Memory Allocated To Memory Optimized Objects', '0.00 MB'));
    this.properties.push(new DatabaseProperties('Memory Used By Memory Optimized Objects', '0.00 MB'));
    this.properties.push(new DatabaseProperties('Collation', 'SQL_Latin1_General_CP1_CI_AS'));
  }
}
