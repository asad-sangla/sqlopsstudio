/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

declare let AngularCore;

@AngularCore.Component({
  selector: 'connection-dashboard',
  templateUrl: require.toUrl('sql/parts/connection/dashboard/app.component.html'),
  styleUrl: require.toUrl('sql/parts/connection/dashboard/app.component.css')
})
export class AppComponent {
  constructor(
    @AngularCore.Inject('ConnectionProfile') private connection: IConnectionProfile) {
  }
}
