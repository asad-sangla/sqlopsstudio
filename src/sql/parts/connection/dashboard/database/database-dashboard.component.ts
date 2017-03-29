/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeDetectorRef } from '@angular/core';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { SchemaExplorerComponent } from './schema-explorer.component';
import data = require('data');

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-database-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/database/database-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css')]
})
export class DatabaseDashboardComponent implements IDashboardPage {

	public ownerUri: string;
	public connection: IConnectionProfile;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;
	public loading: boolean = false;

	@AngularCore.ViewChild('schemaExplorer') schemaExplorer: SchemaExplorerComponent;

	constructor(@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef) {
	}

	public injectState(
			ownerUri: string,
			objectMetadata: data.ObjectMetadata,
			connectionProfile: IConnectionProfile,
			connectionService: IConnectionManagementService,
			metadataService: IMetadataService,
			scriptingService: IScriptingService,
			queryEditorService: IQueryEditorService,
			loading: boolean): void {
		this.ownerUri = ownerUri;
		this.connection = connectionProfile;
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

	public onConnectionChanged(): void {
		this.loading = false;
		this.schemaExplorer.stateInitialized();
	}
}
