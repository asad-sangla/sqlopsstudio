/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit } from '@angular/core';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';


declare let AngularCore;

@AngularCore.Component({
  selector: 'connection-profile',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/database/connection-profile.component.html'),
  styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css')]
})
export class ConnectionProfileComponent implements OnInit {

@AngularCore.Input() public connection: IConnectionProfile;

  constructor() { }

  public ngOnInit() {
  }

}
