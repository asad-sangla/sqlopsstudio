/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { AdvancedPropertiesDialog } from 'sql/parts/connection/connectionDialog/advancedPropertiesDialog';
import data = require('data');

export class AdvancedPropertiesController {
	private _container: HTMLElement;

	private _advancedDialog: AdvancedPropertiesDialog;
	private _options: { [name: string]: any };

	constructor(private _onCloseAdvancedProperties: () => void) {
	}


	private handleOnOk(): void {
		this._options = this._advancedDialog.options;
	}

	public showDialog(providerOptions: data.ConnectionOption[], container: HTMLElement, options: { [name: string]: any }): void {
		this._options = options;
		var connectionPropertiesMaps = {};
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
		this._container = container;
		this.doShowDialog(connectionPropertiesMaps);
	}

	private doShowDialog(connectionPropertiesMaps: { [category: string]: data.ConnectionOption[] }): void {
		if (!this._advancedDialog) {
			this._advancedDialog = new AdvancedPropertiesDialog(this._container, {
				onCancel: () => { },
				onOk: () => this.handleOnOk(),
				onClose: () => this._onCloseAdvancedProperties()
			});
			this._advancedDialog.create();
		}
		return this._advancedDialog.open(connectionPropertiesMaps, this._options);
	}

	public updateAdvancedOption(options: { [name: string]: any }): void {
		this._options = options;
	}
}