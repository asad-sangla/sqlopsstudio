/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { ErrorMessageDialog } from 'sql/workbench/errorMessageDialog/errorMessageDialog';
import Severity from 'vs/base/common/severity';

export class ErrorMessageService implements IErrorMessageService {

	_serviceBrand: any;

	private _container: HTMLElement;
	private _errorDialog: ErrorMessageDialog;

	private handleOnOk(): void {
	}

	public showDialog(container: HTMLElement,  severity: Severity, headerTitle: string, message: string): void {
		this._container = container;
		this.doShowDialog(severity, headerTitle, message);
	}

	private doShowDialog(severity: Severity, headerTitle: string, message: string): void {
		if(!this._errorDialog) {
			this._errorDialog  = new ErrorMessageDialog(this._container, {
				onOk: () => this.handleOnOk(),
			});
			this._errorDialog.create();
		}

		return this._errorDialog.open(severity, headerTitle, message);
	}
}