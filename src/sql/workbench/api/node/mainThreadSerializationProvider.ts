/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import {
	SqlExtHostContext, ExtHostSerializationProviderShape,
	MainThreadSerializationProviderShape, SqlMainContext } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { ISerializationService } from 'sql/services/serialization/serializationService';
import * as data from 'data';
import { IExtHostContext } from 'vs/workbench/api/node/extHost.protocol';
import { extHostNamedCustomer } from 'vs/workbench/api/electron-browser/extHostCustomers';

@extHostNamedCustomer(SqlMainContext.MainThreadSerializationProvider)
export class MainThreadSerializationProvider extends MainThreadSerializationProviderShape {

	private _proxy: ExtHostSerializationProviderShape;

	private _toDispose: IDisposable[];

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		extHostContext: IExtHostContext,
		@ISerializationService private serializationService: ISerializationService

	) {
		super();
		if (extHostContext) {
			this._proxy = extHostContext.get(SqlExtHostContext.ExtHostSerializationProvider);
		}
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $registerSerializationProvider(handle: number): TPromise<any> {
		let self = this;

		this._registrations[handle] = this.serializationService.addEventListener(handle, {
			onSaveAs(saveFormat: string, savePath: string, results: string, appendToFile: boolean): Thenable<data.SaveResultRequestResult> {
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
