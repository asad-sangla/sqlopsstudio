/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ChangeDetectorRef, OnInit } from '@angular/core';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { SchemaExplorerComponent } from '../schema-explorer/schema-explorer.component';

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-database-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/database-dashboard/database-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/database-dashboard/database-dashboard.component.css')]
})
export class DatabaseDashboardComponent implements OnInit, IDashboardPage {

	public ownerUri: string;
	public connection: IConnectionProfile;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;

	@AngularCore.ViewChild('schemaExplorer') schemaExplorer: SchemaExplorerComponent;

	constructor(@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private changeDetectorRef: ChangeDetectorRef) {
	}

	public ngOnInit() {
	}

	public injectState(
		ownerUri: string,
		connectionProfile: IConnectionProfile,
		connectionService: IConnectionManagementService,
		metadataService: IMetadataService,
		scriptingService: IScriptingService,
		queryEditorService: IQueryEditorService): void {
			this.ownerUri = ownerUri;
			this.connection = connectionProfile;
			this.connectionService = connectionService;
			this.metadataService = metadataService;
			this.scriptingService = scriptingService;
			this.queryEditorService = queryEditorService;
			this.changeDetectorRef.detectChanges();
			this.schemaExplorer.stateInitialized();
	}
}
