/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';

export const SERVICE_ID = 'serializationService';

export interface SerializationProviderEvents {
	onSaveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Thenable<boolean>;
}

export const ISerializationService = createDecorator<ISerializationService>(SERVICE_ID);

export interface ISerializationService {
	_serviceBrand: any;

	saveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Thenable<boolean>;

	addEventListener(handle: number, events: SerializationProviderEvents): IDisposable;
}

export class SerializationService implements ISerializationService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _serverEvents: { [handle: number]: SerializationProviderEvents; } = Object.create(null);

	private _lastHandle: number;

	constructor() {
	}

	public addEventListener(handle: number, events: SerializationProviderEvents): IDisposable {
		this._lastHandle = handle;

		this._serverEvents[handle] = events;

		return {
			dispose: () => {
			}
		};
	}

	public saveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Thenable<boolean> {
		if (this._serverEvents === undefined || this._serverEvents[this._lastHandle] === undefined) {
			return undefined;
		}

		return this._serverEvents[this._lastHandle].onSaveAs(saveFormat, savePath, results, appendToFile);
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
