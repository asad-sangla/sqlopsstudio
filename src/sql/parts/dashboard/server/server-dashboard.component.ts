/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { ChangeDetectorRef } from '@angular/core';
import { IDashboardPage } from 'sql/parts/dashboard/common/dashboard';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/services/metadata/metadataService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
import { DatabaseExplorerComponent } from './database-explorer.component';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { TaskUtilities } from 'sql/common/taskUtilities';
import data = require('data');

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-server-dashboard',
	templateUrl: require.toUrl('sql/parts/dashboard/server/server-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class ServerDashboardComponent implements IDashboardPage {

	@AngularCore.ViewChild('databaseExplorer') databaseExplorer: DatabaseExplorerComponent;

	public ownerUri: string;
	public connection: ConnectionManagementInfo;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;
	public adminService: IAdminService;
	public serverPageImage: string = require.toUrl('sql/parts/dashboard/media/server-page.svg');

	constructor(@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef) {
	}

	public injectState(
		ownerUri: string,
		objectMetadata: data.ObjectMetadata,
		connectionInfo: ConnectionManagementInfo,
		connectionService: IConnectionManagementService,
		metadataService: IMetadataService,
		scriptingService: IScriptingService,
		queryEditorService: IQueryEditorService,
		adminService: IAdminService,
		disasterRecoveryService: IDisasterRecoveryService,
		loading: boolean): void {
			this.ownerUri = ownerUri;
			this.connection = connectionInfo;
			this.connectionService = connectionService;
			this.metadataService = metadataService;
			this.scriptingService = scriptingService;
			this.queryEditorService = queryEditorService;
			this.adminService = adminService;
			this.changeDetectorRef.detectChanges();
			this.databaseExplorer.stateInitialized();
	}

	public newQuery(): void {
		TaskUtilities.newQuery(this.connection.connectionProfile, this.connectionService, this.queryEditorService);
	}

	public createDatabase(): void {
		TaskUtilities.showCreateDatabase(this.ownerUri , this.connection, this.adminService);
	}

	public createLogin(): void {
		TaskUtilities.showCreateLogin(this.ownerUri, this.connection, this.adminService);
	}

}
