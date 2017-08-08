/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlExtHostContext, ExtHostSerializationProviderShape, MainThreadSerializationProviderShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { ISerializationService } from 'sql/services/serialization/serializationService';

export class MainThreadSerializationProvider extends MainThreadSerializationProviderShape {

	private _proxy: ExtHostSerializationProviderShape;

	private _toDispose: IDisposable[];

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		@IThreadService threadService: IThreadService,
		@ISerializationService private serializationService: ISerializationService

	) {
		super();
		this._proxy = threadService.get(SqlExtHostContext.ExtHostSerializationProvider);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $registerSerializationProvider(handle: number): TPromise<any> {
		let self = this;

		this._registrations[handle] = this.serializationService.addEventListener(handle, {
			onSaveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Thenable<boolean> {
				return self._proxy.$saveAs(saveFormat, savePath, results, appendToFile);
			}
		});

		return undefined;
	}

	public $unregisterSerializationProvider(handle: number): TPromise<any> {
		let registration = this._registrations[handle];
		if (registration) {
			registration.dispose();
			delete this._registrations[handle];
		}
		return undefined;
	}
}
