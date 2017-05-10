/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DataService } from 'sql/parts/grid/services/dataService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IDbListInterop } from 'sql/parts/common/dblist/dbListInterop';

export interface BootstrapParams {
}

export interface QueryComponentParams extends BootstrapParams {
	dataService: DataService;
}

export interface DbListComponentParams extends BootstrapParams {
	dbListInterop : IDbListInterop;
}

export interface EditDataComponentParams extends BootstrapParams {
	dataService: DataService;
}

export interface DashboardComponentParams extends BootstrapParams {
	connection: ConnectionManagementInfo;
	ownerUri: string;
}

export interface TaskDialogComponentParams extends BootstrapParams {
	ownerUri: string;
}