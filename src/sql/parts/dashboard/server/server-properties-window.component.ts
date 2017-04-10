/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

@AngularCore.Component({
  selector: 'server-properties-window',
  templateUrl: require.toUrl('sql/parts/dashboard/server/server-properties-window.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})

export class ServerPropertiesWindowComponent {

  @AngularCore.Input() public connection: ConnectionManagementInfo;

  constructor() {
  }
}
