/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

export const SERVICE_ID = 'adminService';

import { IInstantiationService, createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';

import { CreateDatabaseInput } from 'sql/parts/admin/database/create/createDatabaseInput';
import { CreateLoginInput } from 'sql/parts/admin/security/createLoginInput';

import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TaskDialogInput } from 'sql/parts/tasks/dialog/taskDialogInput';

import data = require('data');

export const IAdminService = createDecorator<IAdminService>(SERVICE_ID);

export interface IAdminService {
	_serviceBrand: any;

	showCreateDatabaseWizard(uri: string, connection: ConnectionManagementInfo): Promise<any>;

	showCreateLoginWizard(uri: string, connection: ConnectionManagementInfo): Promise<any>;

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
		return new Promise<boolean>((resolve, reject) => {
			let input: TaskDialogInput = self._instantiationService ? self._instantiationService.createInstance(TaskDialogInput, uri, connection) : undefined;
			self._editorService.openEditor(input, { pinned: true }, false);
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

	public showCreateLoginWizard(uri: string, connection: ConnectionManagementInfo): Promise<any> {
		const self = this;

		self.createLogin(uri, { name: 'TEST: login name'});

		return new Promise<boolean>((resolve, reject) => {
			let loginInput: CreateLoginInput = self._instantiationService ? self._instantiationService.createInstance(CreateLoginInput, uri, connection) : undefined;
			self._editorService.openEditor(loginInput, { pinned: true }, false);
			resolve(true);
		});
	}

	public createLogin(connectionUri: string, login: data.LoginInfo): Thenable<data.CreateLoginResponse> {
		let providerId: string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				return provider.createLogin(connectionUri, login);
			}
		}
		return Promise.resolve(undefined);
	}

	public registerProvider(providerId: string, provider: data.AdminServicesProvider): void {
		this._providers[providerId] = provider;
	}
}
