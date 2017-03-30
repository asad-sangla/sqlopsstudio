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
import { DatabaseExplorerComponent } from './database-explorer.component';
import data = require('data');

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-server-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/server/server-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css')]
})
export class ServerDashboardComponent implements IDashboardPage {

	@AngularCore.ViewChild('databaseExplorer') databaseExplorer: DatabaseExplorerComponent;

	public ownerUri: string;
	public connection: IConnectionProfile;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;
	public serverPageImage: string = require.toUrl('sql/parts/connection/dashboard/media/server-page.svg');

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
			this.changeDetectorRef.detectChanges();
			this.databaseExplorer.stateInitialized();
	}

}
