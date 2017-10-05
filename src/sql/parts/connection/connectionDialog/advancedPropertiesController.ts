/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// // import { AdvancedPropertiesDialog } from 'sql/parts/connection/connectionDialog/advancedPropertiesDialog';
import { OptionsDialog } from 'sql/base/browser/ui/modal/optionsDialog';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import data = require('data');
import { localize } from 'vs/nls';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

export class AdvancedPropertiesController {
	private _container: HTMLElement;

	private _advancedDialog: OptionsDialog;
	private _options: { [name: string]: any };

	constructor(private _onCloseAdvancedProperties: () => void,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}


	private handleOnOk(): void {
		this._options = this._advancedDialog.optionValues;
	}

	public showDialog(providerOptions: data.ConnectionOption[], container: HTMLElement, options: { [name: string]: any }): void {
		this._options = options;
		this._container = container;
		var serviceOptions = providerOptions.map(option => AdvancedPropertiesController.connectionOptionToServiceOption(option));
		this.advancedDialog.open(serviceOptions, this._options);
	}

	public get advancedDialog() {
		if (!this._advancedDialog) {
			this._advancedDialog = this._instantiationService.createInstance(
				OptionsDialog, localize('connectionAdvancedProperties', 'Advanced properties'), TelemetryKeys.ConnectionAdvancedProperties, { hasBackButton: true });
			this._advancedDialog.cancelLabel = localize('discard', 'Discard');
			this._advancedDialog.onCloseEvent(() => this._onCloseAdvancedProperties());
			this._advancedDialog.onOk(() => this.handleOnOk());
			this._advancedDialog.render();
		}
		return this._advancedDialog;
	}

	public set advancedDialog(dialog: OptionsDialog) {
		this._advancedDialog = dialog;
	}

	public static connectionOptionToServiceOption(connectionOption: data.ConnectionOption): data.ServiceOption {
		return {
			name: connectionOption.name,
			displayName: connectionOption.displayName,
			description: connectionOption.description,
			groupName: connectionOption.groupName,
			valueType: connectionOption.valueType,
			defaultValue: connectionOption.defaultValue,
			objectType: undefined,
			categoryValues: connectionOption.categoryValues,
			isRequired: connectionOption.isRequired,
			isArray: undefined,
		};
	}
}