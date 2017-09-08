/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlMainContext, MainThreadCredentialManagementShape, ExtHostCredentialManagementShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import * as vscode from 'vscode';
import * as data from 'data';
import { Disposable } from 'vs/workbench/api/node/extHostTypes';

class CredentialAdapter {
	public provider: data.CredentialProvider;

	constructor(provider: data.CredentialProvider) {
		this.provider = provider;
	}

	public saveCredential(credentialId: string, password: string): Thenable<boolean>  {
		return this.provider.saveCredential(credentialId, password);
	}

	public readCredential(credentialId: string): Thenable<data.Credential> {
		return this.provider.readCredential(credentialId);
	}

    public deleteCredential(credentialId: string): Thenable<boolean> {
		return this.provider.deleteCredential(credentialId);
	}
}

type Adapter = CredentialAdapter;

export class ExtHostCredentialManagement extends ExtHostCredentialManagementShape  {
	private _handlePool: number = 0;

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _proxy: MainThreadCredentialManagementShape;

	private _adapter: { [handle: number]: Adapter } = Object.create(null);

	private _createDisposable(handle: number): Disposable {
		return new Disposable(() => {
			delete this._adapter[handle];
			this._proxy.$unregisterCredentialProvider(handle);
		});
	}

	constructor(threadService: IThreadService) {
		super();
		this._proxy = threadService.get(SqlMainContext.MainThreadCredentialManagement);
	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	public $registerCredentialProvider(provider: data.CredentialProvider): vscode.Disposable {
		provider.handle = this._nextHandle();
		this._adapter[provider.handle] = new CredentialAdapter(provider);
		this._proxy.$registerCredentialProvider(provider.handle);
		return this._createDisposable(provider.handle);
	}

	public $getCredentialProvider(namespaceId: string): Thenable<data.CredentialProvider> {
		if (!namespaceId) {
			return TPromise.wrapError(new Error('A namespace must be provided when retrieving a credential provider'));
		}

		return this._withAdapter(0, CredentialAdapter, adapter => {
			// Create a provider that wraps the methods in a namespace
			let provider: data.CredentialProvider = {
				handle: adapter.provider.handle,
				deleteCredential: (credentialId: string) => {
					let namespacedId = ExtHostCredentialManagement._getNamespacedCredentialId(namespaceId, credentialId);
					return adapter.provider.deleteCredential(namespacedId);
				},
				readCredential: (credentialId: string) => {
					let namespacedId = ExtHostCredentialManagement._getNamespacedCredentialId(namespaceId, credentialId);
					return adapter.provider.readCredential(namespacedId);
				},
				saveCredential: (credentialId: string, credential: string) => {
					let namespacedId = ExtHostCredentialManagement._getNamespacedCredentialId(namespaceId, credentialId);
					return adapter.provider.saveCredential(namespacedId, credential);
				}
			};

			return TPromise.as(provider);
		});
	}

	public $saveCredential(credentialId: string, password: string): Thenable<boolean> {
		return this._withAdapter(0, CredentialAdapter, adapter => adapter.saveCredential(credentialId, password));
	}

	public $readCredential(credentialId: string): Thenable<data.Credential> {
		return this._withAdapter(0, CredentialAdapter, adapter => adapter.readCredential(credentialId));
	}

    public $deleteCredential(credentialId: string): Thenable<boolean> {
		return this._withAdapter(0, CredentialAdapter, adapter => adapter.deleteCredential(credentialId));
	}

	/**
	 * Helper method for tests. Not exposed via shape.
	 * @return {number} Number of providers registered
	 */
	public getProviderCount(): number {
		return Object.keys(this._adapter).length;
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private static _getNamespacedCredentialId(namespaceId: string, credentialId: string) {
		return `${namespaceId}|${credentialId}`;
	}

	private _nextHandle(): number {
		return this._handlePool++;
	}

	private _withAdapter<A, R>(handle: number, ctor: { new (...args: any[]): A }, callback: (adapter: A) => Thenable<R>): Thenable<R> {
		let adapter = this._adapter[handle];
		if (!(adapter instanceof ctor)) {
			return TPromise.wrapError(new Error('no adapter found'));
		}
		return callback(<any>adapter);
	}
}
