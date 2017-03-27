/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { OnInit } from '@angular/core';
import { IDashboardPage } from 'sql/parts/connection/dashboard/common/dashboard';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';

declare let AngularCore;

@AngularCore.Component({
	selector: 'app-server-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/server-dashboard/server-dashboard.component.html'),
	styleUrls: [require.toUrl('sql/parts/connection/dashboard/server-dashboard/server-dashboard.component.css')]
})
export class ServerDashboardComponent implements OnInit, IDashboardPage {

	@AngularCore.Input() public connection: IConnectionProfile;

	constructor() { }

	public ngOnInit() {
	}

	public injectState(
		ownerUri: string,
		connectionProfile: IConnectionProfile,
		connectionService: IConnectionManagementService,
		metadataService: IMetadataService,
		connectscriptingServiceionProfile: IScriptingService,
		queryEditorService: IQueryEditorService): void {
			this.connection = connectionProfile;
	}
}
