/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import { ErrorMessageDialog } from 'sql/workbench/errorMessageDialog/errorMessageDialog';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Severity from 'vs/base/common/severity';
import { withElementById } from 'vs/base/browser/builder';
import { IThemeService } from 'vs/platform/theme/common/themeService';

export class ErrorMessageService implements IErrorMessageService {

	_serviceBrand: any;

	private _container: HTMLElement;
	private _errorDialog: ErrorMessageDialog;

	private handleOnOk(): void {
	}

	constructor(
		@IPartService private _partService: IPartService,
		@IThemeService private _themeService: IThemeService
	) {

	}

	public showDialog(container: HTMLElement, severity: Severity, headerTitle: string, message: string): void {
		if (container === undefined) {
			this._container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
		} else {
			this._container = container;
		}

		this.doShowDialog(severity, headerTitle, message);
	}

	private doShowDialog(severity: Severity, headerTitle: string, message: string): void {
		if (!this._errorDialog) {
			this._errorDialog = new ErrorMessageDialog(this._container, {
				onOk: () => this.handleOnOk(),
			}, this._themeService);
			this._errorDialog.create();
		}

		return this._errorDialog.open(severity, headerTitle, message);
	}
}