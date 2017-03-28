/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import data = require('data');

export interface IDashboardPage {
    injectState(
		ownerUri: string,
		objectMetadata: data.ObjectMetadata,
		connectionProfile: IConnectionProfile,
		connectionService: IConnectionManagementService,
		metadataService: IMetadataService,
		scriptingService: IScriptingService,
		queryEditorService: IQueryEditorService,
		loading: boolean): void;
}

export interface IDashboardComponent {
	stateInitialized(): void;
}
