/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import 'vs/css!sql/media/font-awesome-4.7.0/css/font-awesome';


import { MenuItem } from 'primeng/primeng';
import data = require('data');

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { IDashboardPage } from 'sql/parts/dashboard/common/dashboard';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
import { DatabaseDashboardComponent } from './database/database-dashboard.component';
import { ServerDashboardComponent } from './server/server-dashboard.component';
import { ObjectDashboardComponent } from './object/object-dashboard.component';
import { ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

export const DASHBOARD_SELECTOR: string = 'dashboard-component';

@AngularCore.Component({
	selector: DASHBOARD_SELECTOR,
	templateUrl: require.toUrl('sql/parts/dashboard/dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DashboardComponent {

	public ownerUri: string;

	public connection: ConnectionManagementInfo;

	private breadCrumbItems: MenuItem[];

	private currentDatabaseName: string;

	private currentObjectMetadata: data.ObjectMetadata;

	private loading: boolean = false;

	private databasePage: DatabaseDashboardComponent;

	private connectionService: IConnectionManagementService;

	private metadataService: IMetadataService;

	private scriptingService: IScriptingService;

	private queryEditorService: IQueryEditorService;

	private adminService: IAdminService;

	private disasterRecoveryService: IDisasterRecoveryService;

	constructor(
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
		let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);

		this.connectionService = this._bootstrapService.connectionManagementService;
		this.metadataService = this._bootstrapService.metadataService;
		this.scriptingService = this._bootstrapService.scriptingService;
		this.queryEditorService = this._bootstrapService.queryEditorService;
		this.adminService = this._bootstrapService.adminService;
		this.disasterRecoveryService = this._bootstrapService.disasterRecoveryService;

		this.connection = dashboardParameters.connection;
		this.currentDatabaseName = this.connection.connectionProfile.databaseName;
		this.ownerUri = dashboardParameters.ownerUri;
		this.breadCrumbItems = [];
	}

	public onActivate(component: any) {

		this.databasePage = (component instanceof DatabaseDashboardComponent) ? component : undefined;

		let page = component as IDashboardPage;
		if (page) {
			page.injectState(this.ownerUri, this.currentObjectMetadata, this.connection, this.connectionService,
				this.metadataService, this.scriptingService, this.queryEditorService, this.adminService,
				this.disasterRecoveryService, this.loading);
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

	public onActivateServerPage(component: ServerDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({ label: component.connection.connectionProfile.serverName, routerLink: ['/server-dashboard'] });
	}

	public onActivateDatabasePage(component: DatabaseDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({ label: component.connection.connectionProfile.serverName, routerLink: ['/server-dashboard'] });
		this.breadCrumbItems.push({ label: component.connection.connectionProfile.databaseName, routerLink: ['/database-dashboard'] });
	}

	public onActivateObjectPage(component: ObjectDashboardComponent) {
		this.breadCrumbItems = [];
		this.breadCrumbItems.push({ label: component.connection.connectionProfile.serverName, routerLink: ['/server-dashboard'] });
		this.breadCrumbItems.push({ label: component.connection.connectionProfile.databaseName, routerLink: ['/database-dashboard'] });
		this.breadCrumbItems.push({ label: this.currentObjectMetadata.schema + '.' + this.currentObjectMetadata.name, routerLink: ['/object-dashboard'] });
	}

	private onDatabaseChanged(): void {
		this.loading = true;
		this.ownerUri = ConnectionFactory.DashboardUriPrefix + 'browseconn:' + this.connection.connectionProfile.serverName + ';' + this.currentDatabaseName;

		var newProfile = this.connection.connectionProfile.cloneWithDatabase(this.currentDatabaseName);

		this.connectionService.connect(newProfile, this.ownerUri).then(connectionResult => {
			if (connectionResult && connectionResult.connected) {
				this.loading = false;
				this.databasePage.onConnectionChanged();
			}
		});
	}
}
