/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IConnectionManagementService, DashboardParameterWrapper } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';

declare let AngularCore;

@AngularCore.Component({
	selector: 'connection-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/dashboard.component.html'),
	styleUrl: require.toUrl('sql/parts/connection/dashboard/dashboard.component.css')
})
export class AppComponent {

	public ownerUri: string;
	public connection: IConnectionProfile;

	constructor(
		@AngularCore.Inject('DashboardParameters') dashboardParameters: DashboardParameterWrapper,
		@AngularCore.Inject('ConnectionService') private connectionService: IConnectionManagementService,
		@AngularCore.Inject('MetadataService') private metadataService: IMetadataService,
		@AngularCore.Inject('ScriptingService') private scriptingService: IScriptingService,
		@AngularCore.Inject('QueryEditorService') private queryEditorService: IQueryEditorService,) {
			this.ownerUri = dashboardParameters.ownerUri;
			this.connection = dashboardParameters.connection;
	}
}
