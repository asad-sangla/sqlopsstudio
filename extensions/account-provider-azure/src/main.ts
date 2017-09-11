/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import {AzureAccountProviderService} from './azureAccountProviderService';

export function activate(context: vscode.ExtensionContext): void {
	const accountProviderService = new AzureAccountProviderService(context);
	context.subscriptions.push(accountProviderService);
	accountProviderService.activate();
}