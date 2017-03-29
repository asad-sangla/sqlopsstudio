/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/server/server-command-window.component';
import 'vs/css!sql/parts/connection/dashboard/media/font-awesome-4.7.0/css/font-awesome';

declare let AngularCore;

/**
 * Server Command Window component class
 */
@AngularCore.Component({
	selector: 'server-command-window',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/server/server-command-window.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css')]
})

export class ServerCommandWindowComponent {

	constructor() {
	}
}
