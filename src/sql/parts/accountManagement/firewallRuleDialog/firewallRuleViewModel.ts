/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as data from 'data';
import Event, { Emitter } from 'vs/base/common/event';

//import { IAccountManagementService } from 'sql/services/accountManagement/interfaces';

/**
 * View model for firewall rule dialog
 */
export class FirewallRuleViewModel {

	private _providers: data.AccountProviderMetadata[] = [];

	// todo: implement view model for account picker
	// constructor(
	// 	@IAccountManagementService private _accountManagementService: IAccountManagementService
	// ) {
	// }

}