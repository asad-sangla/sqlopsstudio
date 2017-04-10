/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

@AngularCore.Component({
  selector: 'database-properties-window',
  templateUrl: require.toUrl('sql/parts/dashboard/database/database-properties-window.component.html'),
  styleUrls: [ require.toUrl('sql/parts/dashboard/database/database-properties-window.component.css') ]
})

export class DatabasePropertiesWindowComponent {
  @AngularCore.Input() public connection: ConnectionManagementInfo;

  constructor() {
  }
}
