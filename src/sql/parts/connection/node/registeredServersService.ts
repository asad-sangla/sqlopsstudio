/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IConnection, IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';

import { QueryInput } from 'sql/parts/query/common/queryInput';

class Connection implements IConnection {

	public disabledGlobally = false;
	public disabledForWorkspace = false;

	constructor() { }

	get name(): string {
		return "Connection Name";
	}

	get displayName(): string {
		return "Connection Display Name";
	}
}

export class RegisteredServersService implements IRegisteredServersService {
	private disposables: IDisposable[] = [];

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService
	) {
	}

	getConnections(): TPromise<IConnection[]> {
		let connections = [];

		for (var i = 0; i < 25; ++i) {
			connections[i] = new Connection();
		}

		return TPromise.as(connections);
	}

	open(connection: IConnection, sideByside: boolean): TPromise<any> {
		return this.editorService.openEditor(this.instantiationService.createInstance(QueryInput, connection), null, sideByside);
	}

	dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
