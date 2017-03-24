/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { OnInit } from '@angular/core';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

declare let AngularCore;

@AngularCore.Component({
  selector: 'server-profile',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/server-profile/server-profile.component.html'),
  styleUrls: [require.toUrl('sql/parts/connection/dashboard/server-profile/server-profile.component.css')]
})
export class ServerProfileComponent implements OnInit {

@AngularCore.Input() public connection: IConnectionProfile;

  constructor() { }

  public ngOnInit() {
  }

}
