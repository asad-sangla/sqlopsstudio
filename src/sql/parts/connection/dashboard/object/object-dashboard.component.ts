/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/connection/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';

import { ChangeDetectorRef } from '@angular/core';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { ObjectMetadataExplorerComponent } from './objectmetadata-explorer.component';
import data = require('data');

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-object-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/object/object-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class ObjectDashboardComponent implements IDashboardPage {

	@AngularCore.ViewChild('objectMetadataExplorer') objectMetadataExplorer: ObjectMetadataExplorerComponent;

	public ownerUri: string;
	public objectMetadata: data.ObjectMetadata;
	public connection: IConnectionProfile;
	public connectionService: IConnectionManagementService;
	public metadataService: IMetadataService;
	public scriptingService: IScriptingService;
	public queryEditorService: IQueryEditorService;

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
			this.objectMetadata = objectMetadata;
			this.connection = connectionProfile;
			this.connectionService = connectionService;
			this.metadataService = metadataService;
			this.scriptingService = scriptingService;
			this.queryEditorService = queryEditorService;
			this.changeDetectorRef.detectChanges();
			this.objectMetadataExplorer.stateInitialized();
	}

}
