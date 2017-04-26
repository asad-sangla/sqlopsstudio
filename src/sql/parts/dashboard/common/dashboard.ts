/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import data = require('data');

export interface IDashboardPage {
    injectState(
		ownerUri: string,
		objectMetadata: data.ObjectMetadata,
		connectionInfo: ConnectionManagementInfo,
		connectionService: IConnectionManagementService,
		metadataService: IMetadataService,
		scriptingService: IScriptingService,
		queryEditorService: IQueryEditorService,
		adminService: IAdminService,
		disasterRecoveryService: IDisasterRecoveryService,
		loading: boolean): void;
}

export interface IDashboardComponent {
	stateInitialized(): void;
}
