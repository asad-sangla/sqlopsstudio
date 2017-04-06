/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { OnInit } from '@angular/core';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';


declare let AngularCore;

@AngularCore.Component({
  selector: 'connection-profile',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/database/connection-profile.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class ConnectionProfileComponent implements OnInit {

@AngularCore.Input() public connection: ConnectionManagementInfo;

  constructor() { }

  public ngOnInit() {
  }

}
