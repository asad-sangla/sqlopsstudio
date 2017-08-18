/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ScriptAction } from 'sql/workbench/electron-browser/taskUtilities';
import data = require('data');
export const SERVICE_ID = 'scriptingService';

export const IScriptingService = createDecorator<IScriptingService>(SERVICE_ID);

export interface IScriptingService {
	_serviceBrand: any;

	script(connectionUri: string, metadata: data.ObjectMetadata, action: ScriptAction): Thenable<data.ScriptingResult>;

	/**
	 * Register a scripting provider
	 */
	registerProvider(providerId: string, provider: data.ScriptingProvider): void;
}

export class ScriptingService implements IScriptingService {

	public _serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ScriptingProvider; } = Object.create(null);

	constructor(@IConnectionManagementService private _connectionService: IConnectionManagementService) {
	}

	public script(connectionUri: string, metadata: data.ObjectMetadata, action: ScriptAction): Thenable<data.ScriptingResult> {
		let providerId : string = this._connectionService.getProviderIdFromUri(connectionUri);
		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				switch(action)
				{
					case(ScriptAction.ScriptCreateAction):
						return provider.scriptAsCreate(connectionUri, metadata);
					case(ScriptAction.ScriptSelectAction):
						return provider.scriptAsSelect(connectionUri, metadata);
					case(ScriptAction.ScriptDeleteAction):
						return provider.scriptAsDelete(connectionUri, metadata);
					default:
						return Promise.resolve(undefined);
				}
			}
		}
		return Promise.resolve(undefined);
	}

	/**
	 * Register a scripting provider
	 */
	public registerProvider(providerId: string, provider: data.ScriptingProvider): void {
		this._providers[providerId] = provider;
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
