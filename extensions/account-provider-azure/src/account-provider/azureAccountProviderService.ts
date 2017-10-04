/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as data from 'data';
import * as vscode from 'vscode';
import CredentialServiceTokenCache from './credentialServiceTokenCache';
import providerSettings from './providerSettings';
import { AzureAccountProvider } from './azureAccountProvider';
import { AzureAccountProviderMetadata } from './interfaces';

export class AzureAccountProviderService implements vscode.Disposable {
	private static CredentialNamespace = 'azureAccountProviderCredentials';

	private _context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
	}

	public activate(): Thenable<boolean> {
		// Step 1) Get a credential provider
		return data.credentials.getProvider(AzureAccountProviderService.CredentialNamespace)
			.then((credProvider) => {
				// Step 2) Iterate over the enabled providers
				providerSettings.forEach((provider) => {
					// Step 2a) Create a token cache for provider
					let tokenCache = new CredentialServiceTokenCache(credProvider, `tokenCache-${provider.metadata.id}`);

					// Step 2b) Create the provider from the provider's settings
					let accountProvider = new AzureAccountProvider(<AzureAccountProviderMetadata>provider.metadata, tokenCache);

					// Step 2c) Register the provider with the account service
					data.accounts.registerAccountProvider(provider.metadata, accountProvider);
				});
			})
			.then(() => { return true; });
	}

	public dispose() {
		// TODO: Implement any disposal logic here, if necessary
	}
}
