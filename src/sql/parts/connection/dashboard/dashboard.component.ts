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
import { DatabaseDashboardComponent } from './database/database-dashboard.component';
import { ServerDashboardComponent } from './server/server-dashboard.component';
import { ObjectDashboardComponent } from './object/object-dashboard.component';
import { MenuItem } from 'primeng/primeng';
import data = require('data');

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

	private currentDatabaseName: string;

	private currentObjectMetadata: data.ObjectMetadata;

	private loading: boolean = false;

	private databasePage: DatabaseDashboardComponent;

	constructor(
		@AngularCore.Inject('DashboardParameters') private dashboardParameters: DashboardParameterWrapper,
		@AngularCore.Inject('ConnectionService') private connectionService: IConnectionManagementService,
		@AngularCore.Inject('MetadataService') private metadataService: IMetadataService,
		@AngularCore.Inject('ScriptingService') private scriptingService: IScriptingService,
		@AngularCore.Inject('QueryEditorService') private queryEditorService: IQueryEditorService) {
			this.ownerUri = dashboardParameters.ownerUri;
			this.connection = dashboardParameters.connection;
			this.currentDatabaseName = this.connection.databaseName;
            this.breadCrumbItems = [];
	}

	public onActivate(component: any) {

		this.databasePage = (component instanceof DatabaseDashboardComponent) ? component : undefined;

		let page = component as IDashboardPage;
		if (page) {
			page.injectState(this.ownerUri, this.currentObjectMetadata, this.connection, this.connectionService,
				this.metadataService, this.scriptingService, this.queryEditorService,
				this.loading);
		}

		if (component instanceof DatabaseDashboardComponent) {
			this.databasePage = component;
			this.onActivateDatabasePage(component);
		} else if (component instanceof ServerDashboardComponent) {
			this.onActivateServerPage(component);
		} else if (component instanceof ObjectDashboardComponent) {
			this.onActivateObjectPage(component);
		}
    }

	public onDeactivate(component: any) {
		this.databasePage = undefined;

        if (component instanceof ServerDashboardComponent) {
			if (component.databaseExplorer.selectedObject
				&& this.currentDatabaseName.toLowerCase() !== component.databaseExplorer.selectedObject.toLowerCase()) {
				this.currentDatabaseName = component.databaseExplorer.selectedObject;
				this.onDatabaseChanged();
			}
        } else if (component instanceof DatabaseDashboardComponent) {
			if (component.schemaExplorer.selectedObject) {
				this.currentObjectMetadata = component.schemaExplorer.selectedObject.metadata;
			}
		}

    }

	public onActivateDatabasePage(component: DatabaseDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({label: component.connection.serverName, routerLink: ['/server-dashboard'] });
		this.breadCrumbItems.push({label: component.connection.databaseName, routerLink: ['/database-dashboard'] });
	}

	public onActivateServerPage(component: ServerDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({label: component.connection.serverName, routerLink: ['/server-dashboard'] });
	}

	public onActivateObjectPage(component: ObjectDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({label: component.connection.serverName, routerLink: ['/server-dashboard'] });
		this.breadCrumbItems.push({label: component.connection.databaseName, routerLink: ['/database-dashboard'] });
		this.breadCrumbItems.push({label: this.currentObjectMetadata.schema + '.' + this.currentObjectMetadata.name, routerLink: ['/object-dashboard'] });
	}

	private onDatabaseChanged(): void {
		this.loading = true;
		this.ownerUri = 'dashboard://browseconn:' + this.connection.serverName + ';' + this.currentDatabaseName;

		this.connection.databaseName = this.currentDatabaseName;

		this.connectionService.connect(this.ownerUri, this.connection).then(status => {
			this.loading = false;
			this.databasePage.onConnectionChanged();
		});
	}
}
