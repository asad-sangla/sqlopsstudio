/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

export const SERVICE_ID = 'adminService';

import { IInstantiationService, createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { CreateDatabaseInput } from 'sql/parts/admin/database/create/createDatabaseInput';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');

export const IAdminService = createDecorator<IAdminService>(SERVICE_ID);

export interface IAdminService {
	_serviceBrand: any;

	showCreateDatabaseWizard(uri: string, connection: ConnectionManagementInfo): Promise<any>;

	registerProvider(providerId: string, provider: data.AdminServicesProvider): void;
}

export class AdminService implements IAdminService {
	_serviceBrand: any;

	private _providers: { [handle: string]: data.AdminServicesProvider; } = Object.create(null);

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService
	) {
	}

	public showCreateDatabaseWizard(uri: string, connection: ConnectionManagementInfo): Promise<any> {
		const self = this;

		self.createDatabase(uri, { name: 'TEST: database name' });

		return new Promise<boolean>((resolve, reject) => {
			let databaseInput: CreateDatabaseInput = self._instantiationService ? self._instantiationService.createInstance(CreateDatabaseInput, uri, connection) : undefined;
			self._editorService.openEditor(databaseInput, { pinned: true }, false);
			resolve(true);
		});
	}

	public createDatabase(connectionUri: string, database: data.DatabaseInfo): Thenable<data.CreateDatabaseResponse> {
		let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				return provider.createDatabase(connectionUri, database);
			}
		}

		return Promise.resolve(undefined);
	}

	public registerProvider(providerId: string, provider: data.AdminServicesProvider): void {
		this._providers[providerId] = provider;
	}
}
