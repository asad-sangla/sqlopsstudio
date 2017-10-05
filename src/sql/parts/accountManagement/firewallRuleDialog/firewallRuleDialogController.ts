/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';
import { localize } from 'vs/nls';
import * as data from 'data';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IConnectionManagementService, IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { FirewallRuleDialog } from 'sql/parts/accountManagement/firewallRuleDialog/firewallRuleDialog';
import { IResourceManagementService } from 'sql/parts/accountManagement/common/interfaces';

export class FirewallRuleDialogController {

	private _firewallRuleDialog: FirewallRuleDialog;
	private _connection: IConnectionProfile;
	private _firewallRuleErrorTitle = localize('firewallRuleError', 'Firewall rule error');
	private _noAccountError = localize('noAccountError', 'Please add a new account');
	private _refreshAccountError = localize('refreshAccountError', 'Please refresh the account');

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IResourceManagementService private _resourceManagementService: IResourceManagementService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
	}

	private handleOnCreateFirewallRule(): void {
		let ownerUri = this._connectionService.getConnectionId(this._connection);
		let resourceProviderId = '';  //Todo: get the resource provider id
		let firewallRuleInfo: data.FirewallRuleInfo = {
			startIpAddress: this._firewallRuleDialog.viewModel.isIPAddressSelected ? this._firewallRuleDialog.viewModel.defaultIPAddress : this._firewallRuleDialog.viewModel.fromSubnetIPRange,
			endIpAddress: this._firewallRuleDialog.viewModel.isIPAddressSelected ? this._firewallRuleDialog.viewModel.defaultIPAddress : this._firewallRuleDialog.viewModel.toSubnetIPRange,
			serverName: this._connection.serverName,
			securityTokenMappings: {} //Todo: get the security token
		};

		if (this.validateAccount()) {
			this._resourceManagementService.createFirewallRule(ownerUri, this._firewallRuleDialog.selectedAccount, firewallRuleInfo, resourceProviderId).then(createFirewallRuleResponse => {
				if (createFirewallRuleResponse.result) {
					this._firewallRuleDialog.close();
				} else {
					this._errorMessageService.showDialog(Severity.Error, this._firewallRuleErrorTitle, createFirewallRuleResponse.errorMessage);
				}
			}, error => {
				this._errorMessageService.showDialog(Severity.Error, this._firewallRuleErrorTitle, error);
			});
		}
	}

	private validateAccount(): boolean {
		let result = true;
		if (!this._firewallRuleDialog.selectedAccount) {
			result = false;
			this._errorMessageService.showDialog(Severity.Error, this._firewallRuleErrorTitle, this._noAccountError);
		} else if (this._firewallRuleDialog.selectedAccount.isStale) {
			result = false;
			this._errorMessageService.showDialog(Severity.Error, this._firewallRuleErrorTitle, this._refreshAccountError);
		}
		return result;
	}

	/**
	 * Open firewall rule dialog
	 */
	public openFirewallRuleDialog(connection: IConnectionProfile): TPromise<void> {
		// TODO: expand support to multiple providers
		const providerId: string = 'azurePublicCloud';

		if (!this._firewallRuleDialog) {
			this._firewallRuleDialog = this._instantiationService.createInstance(FirewallRuleDialog, providerId);
			this._firewallRuleDialog.onCancel(() => { });
			this._firewallRuleDialog.onCreateFirewallRule(() => this.handleOnCreateFirewallRule);
			this._firewallRuleDialog.render();
		}
		this._connection = connection;
		return new TPromise<void>(() => {
			this._firewallRuleDialog.open();
		});
	}
}
