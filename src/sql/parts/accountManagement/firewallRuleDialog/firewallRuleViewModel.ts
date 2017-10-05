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

	private _defaultIPAddress: string;
	private _defaultFromSubnetIPRange: string;
	private _defaultToSubnetIPRange: string;
	private _fromSubnetIPRange: string;
	private _toSubnetIPRange: string;

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

	public set fromSubnetIPRange(IPAddress: string) {
		this._fromSubnetIPRange = IPAddress;
	}

	public get fromSubnetIPRange(): string {
		if (this._fromSubnetIPRange) {
			return this._fromSubnetIPRange;
		} else {
			return this._defaultFromSubnetIPRange;
		}
	}

	public set toSubnetIPRange(IPAddress: string) {
		this._toSubnetIPRange = IPAddress;
	}

	public get toSubnetIPRange(): string {
		if (this._toSubnetIPRange) {
			return this._toSubnetIPRange;
		} else {
			return this._defaultToSubnetIPRange;
		}
	}
}