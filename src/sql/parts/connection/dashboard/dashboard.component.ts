/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService, DashboardParameterWrapper } from 'sql/parts/connection/common/connectionManagement';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { DatabaseDashboardComponent } from './database-dashboard/database-dashboard.component';
import { ServerDashboardComponent } from './server-dashboard/server-dashboard.component';
import { MenuItem } from 'primeng/primeng';

declare let AngularCore;

@AngularCore.Component({
	selector: 'connection-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/dashboard.component.html'),
	styleUrl: require.toUrl('sql/parts/connection/dashboard/dashboard.component.css')
})
export class AppComponent {

	public ownerUri: string;

	public connection: IConnectionProfile;

	private breadCrumbItems: MenuItem[];

	constructor(
		@AngularCore.Inject('DashboardParameters') private dashboardParameters: DashboardParameterWrapper,
		@AngularCore.Inject('ConnectionService') private connectionService: IConnectionManagementService,
		@AngularCore.Inject('MetadataService') private metadataService: IMetadataService,
		@AngularCore.Inject('ScriptingService') private scriptingService: IScriptingService,
		@AngularCore.Inject('QueryEditorService') private queryEditorService: IQueryEditorService) {
			this.ownerUri = dashboardParameters.ownerUri;
			this.connection = dashboardParameters.connection;
            this.breadCrumbItems = [];
	}

	 onActivate(component: any) {
        let page = component as IDashboardPage;
        if (page) {
            page.injectState(this.ownerUri, this.connection, this.connectionService,
				this.metadataService, this.scriptingService, this.queryEditorService);
        }

        if (component instanceof DatabaseDashboardComponent) {
            this.breadCrumbItems = [];
            this.breadCrumbItems.push({label: component.connection.serverName, routerLink: ['/server-dashboard'] });
            this.breadCrumbItems.push({label: component.connection.databaseName, routerLink: ['/database-dashboard'] });
        } else if (component instanceof ServerDashboardComponent) {
			this.breadCrumbItems = [];
            this.breadCrumbItems.push({label: component.connection.serverName, routerLink: ['/server-dashboard'] });
        }
    }
}
