/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/splashScreen';
import { Builder, $ } from 'vs/base/browser/builder';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
	onShowUiComponent: () => HTMLElement;
	onInitDialog: () => void;
	onFillinConnectionInputs: (connectionInfo: IConnectionProfile) => void;
	onResetConnection: () => void;
}

export class SplashDialogWidget {
	private _builder: Builder;
	private _container: HTMLElement;
	private _dialog: ModalDialogBuilder;

	constructor(container: HTMLElement, @IInstantiationService private _instantiationService: IInstantiationService) {
		this._container = container;
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('splashDialogModal', '', 'splash-dialog-widget', 'splashDialogBody');
		this._builder = this._dialog.create();
		this._dialog.addModalTitle();
		this._builder.build(this._container);
		return this._builder.getHTMLElement();
	}

	public close() {
		jQuery('#splashDialogModal').modal('hide');
	}

	public open() {
		jQuery('#splashDialogModal').modal({ backdrop: false, keyboard: true });
	}
}