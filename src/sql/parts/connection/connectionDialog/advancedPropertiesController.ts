/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { AdvancedPropertiesDialog } from 'sql/parts/connection/connectionDialog/advancedPropertiesDialog';
import vscode = require('vscode');

export class AdvancedPropertiesController {
	private _container: HTMLElement;
	private _connectionProperties: vscode.ConnectionProperty[];

	private _advancedDialog: AdvancedPropertiesDialog;

	private handleOnOk(): void {
		// Update advanced properties
	}

	public showDialog(connectionProperties: vscode.ConnectionProperty[], container: HTMLElement): void {
		this._connectionProperties = connectionProperties;
		this._container = container;
		this.doShowDialog();
	}

	private doShowDialog(): void {
		if(!this._advancedDialog) {
			this._advancedDialog  = new AdvancedPropertiesDialog(this._container, {
				onCancel: () => {},
				onOk: () => this.handleOnOk()
			});
			this._advancedDialog.create();
		}

		return this._advancedDialog.open(this._connectionProperties);
	}
}