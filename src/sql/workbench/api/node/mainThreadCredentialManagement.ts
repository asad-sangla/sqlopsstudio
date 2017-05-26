/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlExtHostContext, ExtHostCredentialManagementShape, MainThreadCredentialManagementShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { ICredentialsService } from 'sql/services/credentials/credentialsService';
import * as data from 'data';

export class MainThreadCredentialManagement extends MainThreadCredentialManagementShape {

	private _proxy: ExtHostCredentialManagementShape;

	private _toDispose: IDisposable[];

	private _registrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		@IThreadService threadService: IThreadService,
		@ICredentialsService private credentialService: ICredentialsService

	) {
		super();
		this._proxy = threadService.get(SqlExtHostContext.ExtHostCredentialManagement);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $registerCredentialProvider(handle: number): TPromise<any> {
		let self = this;

		this._registrations[handle] = this.credentialService.addEventListener(handle, {
			onSaveCredential(credentialId: string, password: string): Thenable<boolean> {
				return self._proxy.$saveCredential(credentialId, password);
			},
			onReadCredential(credentialId: string): Thenable<data.Credential> {
				return self._proxy.$readCredential(credentialId);
			},
			onDeleteCredential(credentialId: string): Thenable<boolean> {
				return self._proxy.$deleteCredential(credentialId);
			}
		});

		return undefined;
	}

	public $unregisterCredentialProvider(handle: number): TPromise<any> {
		let registration = this._registrations[handle];
		if (registration) {
			registration.dispose();
			delete this._registrations[handle];
		}
		return undefined;
	}
}
