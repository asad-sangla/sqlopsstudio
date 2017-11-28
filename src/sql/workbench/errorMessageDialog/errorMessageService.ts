/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { localize } from 'vs/nls';
import Severity from 'vs/base/common/severity';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { ErrorMessageDialog } from 'sql/workbench/errorMessageDialog/errorMessageDialog';

export class ErrorMessageService implements IErrorMessageService {

	_serviceBrand: any;

	private _errorDialog: ErrorMessageDialog;

	private handleOnOk(): void {
	}

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) { }

	public showDialog(severity: Severity, headerTitle: string, message: string, messageDetails?: string): void {
		this.doShowDialog(severity, headerTitle, message, messageDetails);
	}

	private doShowDialog(severity: Severity, headerTitle: string, message: string, messageDetails: string): void {
		if (!this._errorDialog) {
			this._errorDialog = this._instantiationService.createInstance(ErrorMessageDialog);
			this._errorDialog.onOk(() => this.handleOnOk());
			this._errorDialog.render();
		}

		let title = headerTitle ? headerTitle : this.getDefaultTitle(severity);
		return this._errorDialog.open(severity, title, message, messageDetails);
	}

	private getDefaultTitle(severity: Severity) {
		let defaultTitle: string;
		switch (severity) {
			case Severity.Error:
				defaultTitle = localize('error', 'Error');
				break;
			case Severity.Warning:
				defaultTitle = localize('warning', 'Warning');
				break;
			case Severity.Info:
				defaultTitle = localize('info', 'Info');
		}
		return defaultTitle;
	}
}