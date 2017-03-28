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
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/server/server-command-window.component.css')]
})

export class ServerCommandWindowComponent {

	public databases: any;
	public messages: any;

	constructor() {
		this.databases = [];
        this.databases.push({label:'Testing Database', value:{id:1, name: 'DB1', code: 'DB1'}});
        this.databases.push({label:'This is Database', value:{id:2, name: 'DB2', code: 'DB2'}});
        this.databases.push({label:'Database Testing', value:{id:3, name: 'DB3', code: 'DB3'}});
        this.databases.push({label:'Filter Test Database', value:{id:4, name: 'DB4', code: 'DB4'}});
        this.databases.push({label:'Hi Im a Database', value:{id:5, name: 'DB5', code: 'DB5'}});
	}

	deleteDatabase() {
		this.messages = [];
		this.messages.push({severity:'success', summary:'Sucess', detail:'Database Deleted'});
	}

	refreshDatabase(){
		this.messages = [];
		this.messages.push({severity:'success', summary:'Sucess', detail:'Server Refreshed'});
	}

	clear() {
		this.messages = [];
	}
}
