/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as data from 'data';
import {TPromise} from 'vs/base/common/winjs.base';
import {IAccountManagementService} from "sql/services/accountManagement/interfaces";
import {dispose, IDisposable} from "vs/base/common/lifecycle";
import {IThreadService} from "vs/workbench/services/thread/common/threadService";
import {
	ExtHostAccountManagementShape,
	MainThreadAccountManagementShape,
	SqlExtHostContext
} from "sql/workbench/api/node/sqlExtHost.protocol";

export class MainThreadAccountManagement extends MainThreadAccountManagementShape {
	private _providerMetadata: {[handle: number]: data.AccountProviderMetadata};
	private _proxy: ExtHostAccountManagementShape;
	private _toDispose: IDisposable[];

	constructor(
		@IThreadService threadService: IThreadService,
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) {
		super();
		this._providerMetadata = {};
		this._proxy = threadService.get(SqlExtHostContext.ExtHostAccountManagement);
		this._toDispose = [];
	}

	public $registerAccountProvider(providerMetadata: data.AccountProviderMetadata, handle: number): Thenable<any> {
		let self = this;

		// Create the account provider that interfaces with the extension via the proxy and register it
		let accountProvider: data.AccountProvider = {
			initialize(restoredAccounts: data.Account[]): Thenable<data.Account[]> {
				return self._proxy.$initialize(handle, restoredAccounts);
			},
			prompt(): Thenable<data.Account> {
				return self._proxy.$prompt(handle);
			},
			refresh(account: data.Account): Thenable<data.Account> {
				return self._proxy.$refresh(handle, account);
			},
			clear(account: data.Account): Thenable<void> {
				return self._proxy.$clear(handle, account);
			}
		};
		this._accountManagementService.registerProvider(providerMetadata, accountProvider);
		this._providerMetadata[handle] = providerMetadata;

		return TPromise.as(null);
	}

	public $unregisterAccountProvider(handle: number): Thenable<any> {
		this._accountManagementService.unregisterProvider(this._providerMetadata[handle]);
		return TPromise.as(null);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}
}
