/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { AdvancedPropertiesDialog } from 'sql/parts/connection/connectionDialog/advancedPropertiesDialog';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import data = require('data');

export class AdvancedPropertiesController {
	private _container: HTMLElement;

	private _advancedDialog: AdvancedPropertiesDialog;
	private _options: { [name: string]: any };

	constructor(private _onCloseAdvancedProperties: () => void,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}


	private handleOnOk(): void {
		this._options = this._advancedDialog.options;
	}

	public showDialog(providerOptions: data.ConnectionOption[], container: HTMLElement, options: { [name: string]: any }): void {
		this._options = options;
		this._container = container;
		var connectionPropertiesMaps = this.groupConnectionPropertiesByCategory(providerOptions);
		this.advancedDialog.open(connectionPropertiesMaps, this._options);
	}

	public groupConnectionPropertiesByCategory(providerOptions: data.ConnectionOption[]): { [category: string]: data.ConnectionOption[] } {
		var connectionPropertiesMaps: { [category: string]: data.ConnectionOption[] } = {};
		for (var i = 0; i < providerOptions.length; i++) {
			var property = providerOptions[i];
			var groupName = property.groupName;
			if (groupName === null || groupName === undefined) {
				groupName = 'General';
			}

			if (!!connectionPropertiesMaps[groupName]) {
				connectionPropertiesMaps[groupName].push(property);
			} else {
				connectionPropertiesMaps[groupName] = [property];
			}
		}
		return connectionPropertiesMaps;
	}

	public get advancedDialog() {
		if (!this._advancedDialog) {
			this._advancedDialog = this._instantiationService.createInstance(AdvancedPropertiesDialog, this._container, {
				onOk: () => this.handleOnOk(),
				onClose: () => this._onCloseAdvancedProperties(),
			});
			this._advancedDialog.create();
		}
		return this._advancedDialog;
	}

	public set advancedDialog(dialog: AdvancedPropertiesDialog) {
		this._advancedDialog = dialog;
	}
}