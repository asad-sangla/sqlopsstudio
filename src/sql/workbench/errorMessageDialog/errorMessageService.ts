/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { ErrorMessageDialog } from 'sql/workbench/errorMessageDialog/errorMessageDialog';
import Severity from 'vs/base/common/severity';;
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export class ErrorMessageService implements IErrorMessageService {

	_serviceBrand: any;

	private _errorDialog: ErrorMessageDialog;

	private handleOnOk(): void {
	}

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) { }

	public showDialog(container: HTMLElement, severity: Severity, headerTitle: string, message: string): void {
		this.doShowDialog(severity, headerTitle, message);
	}

	private doShowDialog(severity: Severity, headerTitle: string, message: string): void {
		if (!this._errorDialog) {
			this._errorDialog = this._instantiationService.createInstance(ErrorMessageDialog);
			this._errorDialog.onOk(() => this.handleOnOk());
			this._errorDialog.render();
		}

		return this._errorDialog.open(severity, headerTitle, message);
	}
}