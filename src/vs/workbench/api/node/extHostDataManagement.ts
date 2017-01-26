/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { MainContext, MainThreadDataManagementShape, ExtHostDataManagementShape } from './extHost.protocol';
import * as vscode from 'vscode';
import * as connection from 'sql/parts/connection/common/registeredServers';

class Connection implements connection.IConnection {

	public disabledGlobally = false;
	public disabledForWorkspace = false;

	constructor() { }

	get name(): string {
		return "Ext Connection Name";
	}

	get displayName(): string {
		return "Ext Connection Display Name";
	}
}

export class ExtHostDataManagement extends ExtHostDataManagementShape  {

	private _proxy: MainThreadDataManagementShape;

	constructor(
		threadService: IThreadService
	) {
		super();
		this._proxy = threadService.get(MainContext.MainThreadDataManagement);
	}

	$provideConnections(): TPromise<connection.IConnection> {
		this._proxy.$getLanguages().then(e => {
			let f = e + ' then';
		})

		return new TPromise<connection.IConnection>(() =>
		{
			return new Connection();
		});
	}

	$connect(): void {
		let g = 'abc';
	}
}
