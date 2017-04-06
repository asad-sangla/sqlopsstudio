/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { ChangeDetectorRef } from '@angular/core';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionManagementService, IConnectionCompletionOptions, IConnectableInput, ConnectionType } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { SchemaExplorerComponent } from './schema-explorer.component';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import data = require('data');

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-database-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/database/database-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DatabaseDashboardComponent implements IDashboardPage {

	public ownerUri: string;
	public connection: ConnectionManagementInfo;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;
	public loading: boolean = false;
    public serverPageImage: string = require.toUrl('sql/parts/connection/dashboard/media/server-page.svg');

	@AngularCore.ViewChild('schemaExplorer') schemaExplorer: SchemaExplorerComponent;

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
			loading: boolean): void {
		this.ownerUri = ownerUri;
		this.connection = connectionInfo;
		this.connectionService = connectionService;
		this.metadataService = metadataService;
		this.scriptingService = scriptingService;
		this.queryEditorService = queryEditorService;
		this.loading = loading;
		this.changeDetectorRef.detectChanges();

		if (!loading) {
			this.schemaExplorer.stateInitialized();
		}
	}

	public newQuery(): void {
		this.queryEditorService.newSqlEditor('').then((owner: IConnectableInput) => {
			// Connect our editor to the input connection
			let options: IConnectionCompletionOptions = {
				params: { connectionType: ConnectionType.editor, runQueryOnCompletion: false, input: owner },
				saveToSettings: false,
				showDashboard: false,
				showConnectionDialogOnError: true
			};
			this.connectionService.connect(this.connection.connectionProfile, owner.uri, options);
		});
	}

	public onConnectionChanged(): void {
		this.loading = false;
		this.schemaExplorer.stateInitialized();
	}
}
