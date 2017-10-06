/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import * as data from 'data';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

export const SERVICE_ID = 'resourceManagementService';
export const IResourceManagementService = createDecorator<IResourceManagementService>(SERVICE_ID);

export interface IHandleFirewallRuleResult {
	result: boolean;
	ipAddress: string;
	resourceProviderId: string;
}

export interface IResourceManagementService {
	_serviceBrand: any;

	/**
	 * Register a resource provider
	 */
	registerProvider(providerId: string, provider: data.ResourceProvider): void;

	/**
	 * Create a firewall rule
	 */
	createFirewallRule(selectedAccount: data.Account, firewallruleInfo: data.FirewallRuleInfo, resourceProviderId: string): Thenable<data.CreateFirewallRuleResponse>;

	/**
	 * handle a firewall rule
	 */
	handleFirewallRule(errorCode: number, errorMessage: string, connectionTypeId: string): Thenable<IHandleFirewallRuleResult>;

	/**
	 * Show firewall rule dialog
	 */
	showFirewallRuleDialog(connection: IConnectionProfile, ipAddress: string, resourceProviderId: string): Thenable<boolean>;
}

