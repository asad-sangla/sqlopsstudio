/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

/**
 * View model for firewall rule dialog
 */
export class FirewallRuleViewModel {
	public isIPAddressSelected: boolean;
	public fromSubnetIPRange: string;
	public toSubnetIPRange: string;

	private _defaultIPAddress: string;
	private _defaultFromSubnetIPRange: string;
	private _defaultToSubnetIPRange: string;

	// todo: integrate the view model with firewall rule service
	constructor() {
		this.isIPAddressSelected = true;
	}

	public get defaultIPAddress(): string {
		return this._defaultIPAddress;
	}

	public get defaultFromSubnetIPRange(): string {
		return this._defaultFromSubnetIPRange;
	}

	public get defaultToSubnetIPRange(): string {
		return this._defaultToSubnetIPRange;
	}
}