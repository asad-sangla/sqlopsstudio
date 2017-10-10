/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import * as data from 'data';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

export const SERVICE_ID = 'resourceProviderService';
export const IResourceProviderService = createDecorator<IResourceProviderService>(SERVICE_ID);

export interface IHandleFirewallRuleResult {
	canHandleFirewallRule: boolean;
	ipAddress: string;
	resourceProviderId: string;
}

export interface IResourceProviderService {
	_serviceBrand: any;

	/**
	 * Register a resource provider
	 */
	registerProvider(providerId: string, provider: data.ResourceProvider): void;

	/**
	 * Unregister a resource provider
	 */
	unregisterProvider(ProviderId: string): void;

	/**
	 * Create a firewall rule
	 */
	createFirewallRule(selectedAccount: data.Account, firewallruleInfo: data.FirewallRuleInfo, resourceProviderId: string): Promise<data.CreateFirewallRuleResponse>;

	/**
	 * handle a firewall rule
	 */
	handleFirewallRule(errorCode: number, errorMessage: string, connectionTypeId: string): Promise<IHandleFirewallRuleResult>;

	/**
	 * Show firewall rule dialog
	 */
	showFirewallRuleDialog(connection: IConnectionProfile, ipAddress: string, resourceProviderId: string): Promise<boolean>;
}

