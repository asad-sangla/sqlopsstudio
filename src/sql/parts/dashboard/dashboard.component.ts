/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { MenuItem } from 'primeng/primeng';
import data = require('data');

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionFactory } from 'sql/parts/connection/common/connectionFactory';
import { IDashboardPage } from 'sql/parts/dashboard/common/dashboard';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { DatabaseDashboardComponent } from './database/database-dashboard.component';
import { ServerDashboardComponent } from './server/server-dashboard.component';
import { ObjectDashboardComponent } from './object/object-dashboard.component';
import { ElementRef } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

declare let AngularCore;

@AngularCore.Component({
	selector: 'connection-dashboard',
	templateUrl: require.toUrl('sql/parts/dashboard/dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class AppComponent {

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

	constructor(
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        this.ownerUri = this._el.nativeElement.parentElement.getAttribute('bootstrap-id');
        let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this.ownerUri);

		this.connectionService = this._bootstrapService.connectionManagementService;
		this.metadataService = this._bootstrapService.metadataService;
		this.scriptingService = this._bootstrapService.scriptingService;
		this.queryEditorService = this._bootstrapService.queryEditorService;

		this.connection = dashboardParameters.connection;
		this.currentDatabaseName = this.connection.connectionProfile.databaseName;
		this.ownerUri = dashboardParameters.ownerUri;
		this.breadCrumbItems = [];
	}

	public static AngularSelectorString: string = 'connection-dashboard';

	private static nextSelectorId: number = 0;

	public static getNextAngularSelectorString(): string {
		++this.nextSelectorId;
		return this.getCurrentAngularSelectorString();
	}

	public static getCurrentAngularSelectorString(): string {
		return AppComponent.AngularSelectorString + this.nextSelectorId;
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

		this.connection.connectionProfile.databaseName = this.currentDatabaseName;

		this.connectionService.connect(this.connection.connectionProfile, this.ownerUri).then(connectionResult => {
			if (connectionResult && connectionResult.connected) {
				this.loading = false;
				this.databasePage.onConnectionChanged();
			}
		});
	}
}
