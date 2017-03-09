/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import vscode = require('vscode');

export const SERVICE_ID = 'credentialsService';

export interface CredentialManagementEvents {
	onSaveCredential(credentialId: string, password: string): Thenable<boolean>;

	onReadCredential(credentialId: string): Thenable<vscode.Credential>;

	onDeleteCredential(credentialId: string): Thenable<boolean>;
}

export const ICredentialsService = createDecorator<ICredentialsService>(SERVICE_ID);

export interface ICredentialsService {
	_serviceBrand: any;

	saveCredential(credentialId: string, password: string): Thenable<boolean>;

	readCredential(credentialId: string): Thenable<vscode.Credential>;

	deleteCredential(credentialId: string): Thenable<boolean>;

	addEventListener(handle: number, events: CredentialManagementEvents): IDisposable;
}

export class CredentialsService implements ICredentialsService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _serverEvents: { [handle: number]: CredentialManagementEvents; } = Object.create(null);

	private _lastHandle: number;

	constructor() {
	}

	public addEventListener(handle: number, events: CredentialManagementEvents): IDisposable {
		this._lastHandle = handle;

		this._serverEvents[handle] = events;

		return {
			dispose: () => {
			}
		};
	}

	public saveCredential(credentialId: string, password: string): Thenable<boolean> {
		if (this._serverEvents === undefined || this._serverEvents[this._lastHandle] === undefined) {
			return undefined;
		}

		return this._serverEvents[this._lastHandle].onSaveCredential(credentialId, password);
	}

	public readCredential(credentialId: string): Thenable<vscode.Credential> {
		return this._serverEvents[this._lastHandle].onReadCredential(credentialId);
	}

	public deleteCredential(credentialId: string): Thenable<boolean> {
		return this._serverEvents[this._lastHandle].onDeleteCredential(credentialId);
	 }

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
