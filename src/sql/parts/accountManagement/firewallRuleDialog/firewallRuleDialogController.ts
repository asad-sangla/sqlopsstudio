/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { FirewallRuleDialog } from 'sql/parts/accountManagement/firewallRuleDialog/firewallRuleDialog';

export class FirewallRuleDialogController {

	private _firewallRuleDialog: FirewallRuleDialog;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	private handleOnCreateFirewallRule(): void {
		// todo: create firewall rule
	}

	/**
	 * Open firewall rule dialog
	 */
	public openFirewallRuleDialog(): TPromise<void> {
		if (!this._firewallRuleDialog) {
			this._firewallRuleDialog = this._instantiationService.createInstance(FirewallRuleDialog);
			this._firewallRuleDialog.onCancel(() => { });
			this._firewallRuleDialog.onCreateFirewallRule(() => this.handleOnCreateFirewallRule);
			this._firewallRuleDialog.render();
		}

		return new TPromise<void>(() => {
			this._firewallRuleDialog.open();
		});
	}
}
