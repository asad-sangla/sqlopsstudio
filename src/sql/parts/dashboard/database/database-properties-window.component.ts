/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Input, Component } from '@angular/core';

import 'vs/css!sql/parts/dashboard/media/dashboard';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

@Component({
  selector: 'database-properties-window',
  templateUrl: require.toUrl('sql/parts/dashboard/database/database-properties-window.component.html'),
  styleUrls: [ require.toUrl('sql/parts/dashboard/database/database-properties-window.component.css') ]
})

export class DatabasePropertiesWindowComponent {
  @Input() public connection: ConnectionManagementInfo;

  constructor() {
  }
}
