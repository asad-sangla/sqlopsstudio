/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as nls from 'vscode-nls';
import * as vscode from 'vscode';
import * as data from 'data';

const localize = nls.loadMessageBundle();

export class AzureAccountProviderService implements vscode.Disposable {
	private _context: vscode.ExtensionContext;
	private _initialized: boolean = false;

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
	}

	public activate(): Thenable<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			let provider = new AzureAccountProvider();
			data.accounts.registerAccountProvider(AzureAccountProvider.ProviderMetadata, provider);

			self._initialized = true;
			resolve(true);
		});
	}

	dispose() {
		// TODO: Implement any disposal logic here, if necessary
	}
}

export class AzureAccountProvider implements data.AccountProvider {
	public static ProviderMetadata: data.AccountProviderMetadata = {
		displayName: localize('azureName', 'Microsoft Azure'),
		id: 'azure'
	};

	initialize(restoredAccounts: data.Account[]): Promise<data.Account[]> {
		// TODO: Implement... No-op for now to make sure that the account management code doesn't fail
		return Promise.resolve([]);
	}

	prompt(): Promise<data.Account> {
		throw new Error('Not implemented');
	}

	refresh(account: data.Account): Promise<data.Account> {
		throw new Error('Not implemented');
	}

	clear(accountKey: data.AccountKey): Promise<void> {
		throw new Error('Not implemented');
	}
	// addListener(event, listener: data.AccountStaleListener): this;
	// addListener(event: string, listener: Function): this;
	// addListener(event, listener): this {
	// 	throw new Error('Not implemented');
	// }
    //
	// on(event, listener: data.AccountStaleListener): this;
	// on(event: string, listener: Function): this;
	// on(event, listener): this {
	// 	throw new Error('Not implemented');
	// }
    //
	// once(event, listener: data.AccountStaleListener): this;
	// once(event: string, listener: Function): this;
	// once(event, listener): this {
	// 	throw new Error('Not implemented');
	// }
    //
	// removeListener(event, listener: data.AccountStaleListener): this;
	// removeListener(event: string, listener: Function): this;
	// removeListener(event, listener): this {
	// 	throw new Error('Not implemented');
	// }
    //
	// listeners(event): data.AccountStaleListener[];
	// listeners(event: string): Function[];
	// listeners(event): any {
	// }
    //
	// emit(event, account: data.Account): boolean;
	// emit(event: string, ...args: any[]): boolean;
	// emit(event, ...account): boolean {
	// 	throw new Error('Not implemented');
	// }

}
