/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as data from 'data';
import Event, { Emitter } from 'vs/base/common/event';

import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

/**
 * Parameters for setting the list of source database names and selected database name in the restore dialog
 */
export interface ProviderAccountParam {
	providerId: string;
	providerDisplayName: string;
	accounts: data.Account[];
}

function reflect(promise: Promise<any>): any {
	return promise.then(function (v) { return v; },
		function (e) { return e; });
}

/**
 * View model for account dialog
 */
export class AccountViewModel {

	private _providers: data.AccountProviderMetadata[] = [];

	private _onUpdateProviderAccounts = new Emitter<ProviderAccountParam>();
	public onUpdateProviderAccounts: Event<ProviderAccountParam> = this._onUpdateProviderAccounts.event;

	constructor(
		@IAccountManagementService private _accountManagementService: IAccountManagementService
	) {
	}

	/**
	 * Get accounts for each provider
	 */
	public getAccountsForProvider(): Thenable<void> {
		return this._accountManagementService.getAccountProviderMetadata().then((providers: data.AccountProviderMetadata[]) => {
			// Step 1: Load the providers and create ui elements for them
			for (let provider of providers) {
				this._providers.push(provider);
			}
		})
			.then(() => {
				// Step 2: For each provider, retrieve the accounts for each
				let promises = this._providers.map(provider => {
					return this._accountManagementService.getAccountsForProvider(provider.id).then((accounts: data.Account[]) => {
						if (accounts) {
							this._onUpdateProviderAccounts.fire({ providerId: provider.id, providerDisplayName: provider.displayName, accounts: accounts });
						}
					});
				});
				return Promise.all(promises.map(reflect)).then(() => undefined);
			});
	}
}