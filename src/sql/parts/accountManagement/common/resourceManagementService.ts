/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IResourceManagementService, IHandleFirewallRuleResult } from 'sql/parts/accountManagement/common/interfaces';
import * as Constants from 'sql/common/constants';
import * as TelemetryKeys from 'sql/common/telemetryKeys';
import * as TelemetryUtils from 'sql/common/telemetryUtilities';
import { FirewallRuleDialogController } from 'sql/parts/accountManagement/firewallRuleDialog/firewallRuleDialogController';

import * as data from 'data';

export class ResourceManagementService implements IResourceManagementService {

	public _serviceBrand: any;
	private _providers: { [handle: string]: data.ResourceProvider; } = Object.create(null);
	private _firewallRuleDialogController: FirewallRuleDialogController;

	constructor(
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@ITelemetryService private _telemetryService: ITelemetryService,
		@IInstantiationService private _instantiationService: IInstantiationService,
	) {
	}

	/**
	 * Opens the firewall rule dialog
	 */
	public showFirewallRuleDialog(connection: IConnectionProfile): TPromise<void> {
		let self = this;
		// If the firewall rule dialog hasn't been defined, create a new one
		if (!self._firewallRuleDialogController) {
			self._firewallRuleDialogController = self._instantiationService.createInstance(FirewallRuleDialogController);
		}

		return new TPromise<void>(() => {
			self._firewallRuleDialogController.openFirewallRuleDialog(connection);
		});
	}

	/**
	 * Create a firewall rule
	 */
	public createFirewallRule(connectionUri: string, selectedAccount: data.Account, firewallruleInfo: data.FirewallRuleInfo, resourceProviderId: string): Thenable<data.CreateFirewallRuleResponse> {
		return new Promise<data.CreateFirewallRuleResponse>((resolve, reject) => {
			let provider = this._providers[resourceProviderId];
			if (provider) {
				TelemetryUtils.addTelemetry(this._telemetryService, TelemetryKeys.FirewallRuleRequested, { provider: resourceProviderId });
				provider.createFirewallRule(selectedAccount, firewallruleInfo).then(result => {
					resolve(result);
				}, error => {
					reject(error);
				});
			} else {
				reject(Constants.InvalidProvider);
			}
		});
	}

	/**
	 * Handle a firewall rule
	 */
	public handleFirewallRule(errorCode: number, errorMessage: string, connectionTypeId: string): Thenable<IHandleFirewallRuleResult> {
		return new Promise<IHandleFirewallRuleResult>((resolve, reject) => {
			let handleFirewallRuleResult: IHandleFirewallRuleResult;
			let promises = [];
			for (let key in this._providers) {
				let provider = this._providers[key];
				promises.push(provider.handleFirewallRule(errorCode, errorMessage, connectionTypeId)
					.then(response => {
						if (response.result) {
							handleFirewallRuleResult = { result: response.result, ipAddress: response.ipAddress, resourceProviderId: key };
						}
					},
					() => { /* Swallow failures at getting accounts, we'll just hide that provider */
					}));
			}

			Promise.all(promises).then(() => {
				if (handleFirewallRuleResult) {
					resolve(handleFirewallRuleResult);
				} else {
					reject({ result: false, IPAddress: undefined, providerId: undefined });
				}
			});
		});
	}

	/**
	 * Register a resource provider
	 */
	public registerProvider(providerId: string, provider: data.ResourceProvider): void {
		this._providers[providerId] = provider;
	}
}
