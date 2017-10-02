/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ScriptOperation} from 'sql/workbench/common/taskUtilities';
import data = require('data');
export const SERVICE_ID = 'scriptingService';

export const IScriptingService = createDecorator<IScriptingService>(SERVICE_ID);

export interface IScriptingService {
	_serviceBrand: any;

	script(connectionUri: string, metadata: data.ObjectMetadata, operation: ScriptOperation, paramDetails: data.ScriptingParamDetails): Thenable<data.ScriptingResult>;

	/**
	 * Register a scripting provider
	 */
	registerProvider(providerId: string, provider: data.ScriptingProvider): void;
}

export class ScriptingService implements IScriptingService {

	public _serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ScriptingProvider; } = Object.create(null);

	constructor(@IConnectionManagementService private _connectionService: IConnectionManagementService) { }

	/**
	 * Call the service for scripting based on provider and scripting operation
	 * @param connectionUri
	 * @param metadata
	 * @param operation
	 * @param paramDetails
	 */
	public script(connectionUri: string, metadata: data.ObjectMetadata, operation: ScriptOperation, paramDetails: data.ScriptingParamDetails): Thenable<data.ScriptingResult> {
		let providerId : string = this._connectionService.getProviderIdFromUri(connectionUri);

		if (providerId) {
			let provider = this._providers[providerId];
			if (provider) {
				switch(operation)
				{
					case(ScriptOperation.Select):
						return provider.scriptAsSelect(connectionUri, metadata, paramDetails);
					case(ScriptOperation.Create):
						return provider.scriptAsCreate(connectionUri, metadata, paramDetails);
					case(ScriptOperation.Delete):
						return provider.scriptAsDelete(connectionUri, metadata, paramDetails);
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
