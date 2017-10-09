/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as data from 'data';
import {TPromise} from 'vs/base/common/winjs.base';
import { IResourceProviderService } from 'sql/parts/accountManagement/common/interfaces';
import {dispose, IDisposable} from 'vs/base/common/lifecycle';
import {
	ExtHostResourceProviderShape,
	MainThreadResourceProviderShape,
	SqlExtHostContext,
	SqlMainContext
} from 'sql/workbench/api/node/sqlExtHost.protocol';
import { IExtHostContext } from 'vs/workbench/api/node/extHost.protocol';
import { extHostNamedCustomer } from 'vs/workbench/api/electron-browser/extHostCustomers';


@extHostNamedCustomer(SqlMainContext.MainThreadResourceProvider)
export class MainThreadResourceProvider extends MainThreadResourceProviderShape {
	private _providerMetadata: {[handle: number]: data.AccountProviderMetadata};
	private _proxy: ExtHostResourceProviderShape;
	private _toDispose: IDisposable[];

	constructor(
		extHostContext: IExtHostContext,
		@IResourceProviderService private _resourceProviderService: IResourceProviderService
	) {
		super();
		this._providerMetadata = {};
		if (extHostContext) {
			this._proxy = extHostContext.get(SqlExtHostContext.ExtHostResourceProvider);
		}
		this._toDispose = [];
	}

	public $registerResourceProvider(providerMetadata: data.ResourceProviderMetadata, handle: number): Thenable<any> {
		let self = this;

		// Create the account provider that interfaces with the extension via the proxy and register it
		let resourceProvider: data.ResourceProvider = {
			createFirewallRule(account: data.Account, firewallruleInfo: data.FirewallRuleInfo): Thenable<data.CreateFirewallRuleResponse> {
				return self._proxy.$createFirewallRule(handle, account, firewallruleInfo);
			},
			handleFirewallRule(errorCode: number, errorMessage: string, connectionTypeId: string): Thenable<data.HandleFirewallRuleResponse> {
				return self._proxy.$handleFirewallRule(handle, errorCode, errorMessage, connectionTypeId);
			}
		};
		this._resourceProviderService.registerProvider(providerMetadata.id, resourceProvider);
		this._providerMetadata[handle] = providerMetadata;

		return TPromise.as(null);
	}

	public $unregisterResourceProvider(handle: number): Thenable<any> {
		this._resourceProviderService.unregisterProvider(this._providerMetadata[handle].id);
		return TPromise.as(null);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}
}
