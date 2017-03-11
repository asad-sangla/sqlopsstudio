/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import data = require('data');

export const SERVICE_ID = 'scriptingService';

export const IScriptingService = createDecorator<IScriptingService>(SERVICE_ID);

export interface IScriptingService {
	_serviceBrand: any;

	scriptObject(providerId: string, connectionUri: string, objectName: string): Thenable<data.ScriptingResult>;

	/**
	 * Register a scripting provider
	 */
	registerProvider(providerId: string, provider: data.ScriptingProvider): void;
}

export class ScriptingService implements IScriptingService {

	public _serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ScriptingProvider; } = Object.create(null);

	constructor() {
	}

	public scriptObject(providerId: string, connectionUri: string, objectName: string): Thenable<data.ScriptingResult> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.scriptAsSelect(connectionUri, objectName);
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
