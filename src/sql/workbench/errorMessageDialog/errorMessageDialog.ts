/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/errorMessageDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import Severity from 'vs/base/common/severity';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { clipboard } from 'electron';

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
	private _modalTitle: Builder;
	private _modalBody: Builder;
	private _message: string;

	constructor(container: HTMLElement, callbacks: IErrorMessageCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._message = '';
	}

	public create(): HTMLElement {
		this._builder = $().div({}, (div: Builder) => {
			div.div({ class: 'modal', id: 'errorMessageModal', 'role': 'dialog', 'tabindex': -1 }, (dialogContainer) => {
				dialogContainer.div({ class: 'modal-dialog ', role: 'document' }, (modalDialog) => {
					modalDialog.div({ class: 'modal-content' }, (modelContent) => {
						modelContent.div({ class: 'modal-header' }, (modalHeader) => {
							modalHeader.element('button',
								{ type: 'button', class: 'close', 'data-dismiss': 'modal', 'aria-label': 'close', 'aria-hidden': 'true' },
								(menuCloseButton) => {
									menuCloseButton.innerHtml('&times;');
								});
							modalHeader.div({ class: 'modal-title' }, (modalTitle) => {
								this._modalTitle = modalTitle
							});
						});
						modelContent.div({ class: 'modal-body', id: 'errorContent' }, (modelBody) => {
							this._modalBody = modelBody;
						});
						modelContent.div({ class: 'modal-footer' }, (modelFooter) => {
							this.createCopyButton(modelFooter);
							modelFooter.element('table', { class: 'footer-buttons', align: 'right' }, (tableContainer) => {
								tableContainer.element('tr', {}, (rowContainer) => {
									this._okButton = this.createFooterButton(rowContainer, 'OK');
								});
							});
						});
					});
				});
			});
		})
		.addClass('error-dialog');
		this._builder.build(this._container);
		this._modelElement = this._builder.getHTMLElement();
		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.ok();
			}
		});

		return this._modelElement;
	}

	private updateDialogHeader(dialogTitle: string): void {
		this._modalTitle.innerHtml(dialogTitle);
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
		container.div({ class: 'modal-copy' }, (cellContainer) => {
			let button = new Button(cellContainer);
			button.icon = 'copyButtonIcon';
			button.addListener2('click', () => {
				clipboard.writeText(this._message);
			});
			cellContainer.child(0).title('Copy to Clipboard');
		});
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', { class: 'footer-button' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.label = title;
			button.addListener2('click', () => {
				if (title === 'OK') {
					this.ok();
				}
			});
		});

		return button;
	}

	public ok(): void {
		this._callbacks.onOk();
		this.close();
	}

	public close() {
		jQuery('#errorMessageModal').modal('hide');
	}

	public open(severity: Severity, headerTitle: string, message: string) {
		this._severity = severity;
		this._message = message;
		this.updateDialogHeader(headerTitle);
		this.updateDialogBody();
		jQuery('#errorMessageModal').modal({ backdrop: false, keyboard: true });
	}

	public dispose(): void {
	}
}