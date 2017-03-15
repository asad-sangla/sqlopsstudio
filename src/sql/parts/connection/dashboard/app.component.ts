/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';

declare let AngularCore;

@AngularCore.Component({
	selector: 'connection-dashboard',
	templateUrl: require.toUrl('sql/parts/connection/dashboard/app.component.html'),
	styleUrl: require.toUrl('sql/parts/connection/dashboard/app.component.css')
})
export class AppComponent {
	constructor(
		@AngularCore.Inject('OwnerUri') private ownerUri: string,
		@AngularCore.Inject('ConnectionProfile') private connection: IConnectionProfile,
		@AngularCore.Inject('ConnectionService') private connectionService: IConnectionManagementService,
		@AngularCore.Inject('MetadataService') private metadataService: IMetadataService,
		@AngularCore.Inject('ScriptingService') private scriptingService: IScriptingService,
		@AngularCore.Inject('QueryEditorService') private queryEditorService: IQueryEditorService,) {
	}
}
