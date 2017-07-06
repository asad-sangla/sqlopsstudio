/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/errorMessageDialog';
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import Severity from 'vs/base/common/severity';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { clipboard } from 'electron';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { attachModalDialogStyler } from 'sql/common/theme/styler';

export interface IErrorMessageCallbacks {
	onOk: () => void;
}

export class ErrorMessageDialog {
	private _builder: Builder;
	private _severity: Severity;
	private _container: HTMLElement;
	private _modelElement: HTMLElement;
	private _callbacks: IErrorMessageCallbacks;
	private _okButton: Button;
	private _modalBody: Builder;
	private _message: string;
	private _themeService: IThemeService;
	private _dialog: ModalDialogBuilder;

	constructor(container: HTMLElement, callbacks: IErrorMessageCallbacks, themeService: IThemeService) {
		this._container = container;
		this._callbacks = callbacks;
		this._themeService = themeService;
		this._message = '';
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('', 'error-dialog', 'errorDialogBody');
		this._builder = this._dialog.create(false);
		attachModalDialogStyler(this._dialog, this._themeService);
		this._dialog.addModalTitle();
		this._modalBody = this._dialog.bodyContainer;
		this.createCopyButton(this._dialog.footerContainer);
		this._okButton = this.createFooterButton(this._dialog.footerContainer, 'OK');

		this._builder.build(this._container);
		jQuery(this._builder.getHTMLElement()).modal({ backdrop: false, keyboard: true });
		this._builder.hide();
		this._modelElement = this._builder.getHTMLElement();
		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.ok();
			}
		});

		return this._modelElement;
	}

	private updateDialogBody(): void {
		jQuery('#errorContent').empty();
		switch (this._severity) {
			case Severity.Error:
				this._modalBody.element('img', { 'class': 'error-icon' });
				break;
			case Severity.Warning:
				this._modalBody.element('img', { 'class': 'warning-icon' });
				break;
			case Severity.Info:
				this._modalBody.element('img', { 'class': 'info-icon' });
				break;
		}
		this._modalBody.div({ class: 'error-message' }, (errorContainer) => {
			errorContainer.innerHtml(this._message);
		});
	}

	private createCopyButton(container: Builder): void {
		let button: Button;
		container.div({ class: 'modal-copy' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.icon = 'copyButtonIcon';
			button.addListener('click', () => {
				clipboard.writeText(this._message);
			});
			cellContainer.child(0).title('Copy to Clipboard');
		});

		// Theme styler
		attachButtonStyler(button, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND });
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', { class: 'footer-button' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.label = title;
			button.addListener('click', () => {
				if (title === 'OK') {
					this.ok();
				}
			});
		});
		// Theme styler
		attachButtonStyler(button, this._themeService);

		return button;
	}

	public ok(): void {
		this._callbacks.onOk();
		this.close();
	}

	public close() {
		this._builder.hide();
	}

	public open(severity: Severity, headerTitle: string, message: string) {
		this._severity = severity;
		this._message = message;
		this._dialog.setDialogTitle(headerTitle);
		this.updateDialogBody();
		this._builder.show();
	}

	public dispose(): void {
	}
}