/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Builder, $ } from 'vs/base/browser/builder';
import { IconLabel } from 'vs/base/browser/ui/iconLabel/iconLabel';
import { IThemable } from 'vs/platform/theme/common/styler';
import { Color } from 'vs/base/common/color';

export interface IModalDialogStyles {
	dialogForeground?: Color;
	dialogBorder?: Color;
	dialogHeaderAndFooterBackground?: Color;
	dialogBodyBackground?: Color;
}

export class ModalDialogBuilder implements IThemable {

	private _builder: Builder;
	private _footerBuilder: Builder;
	private _modalBody: Builder;
	private _modalHeader: Builder;
	private _modalTitle: Builder;
	private _errorMessageLabel: IconLabel;
	private _spinnerElement: HTMLElement;
	private _errorIconElement: HTMLElement;
	private _dialogForeground: Color;
	private _dialogBorder: Color;
	private _dialogHeaderAndFooterBackground: Color;
	private _dialogBodyBackground: Color;

	private _modalDialog: Builder;
	private _modalHeaderSection: Builder;
	private _modalBodySection: Builder;
	private _modalFooterSection: Builder;
	private _closeButtonInHeader: Builder;

	constructor(
		private _title: string,
		private _class: string,
		private _bodyId: string
	) {
	}

	/*
	* Create modal dialog
	* flyout: indicates whether the dialog should be flyout or not
	* isAngularComponent: false if the dialog is created using DOM manipulation, true if created through angular component template
	*/
	public create(flyout: boolean, isAngularComponent: boolean = false): Builder {
		let modalBodyClass = (isAngularComponent === false ? 'modal-body' : 'modal-body-and-footer');

		// This modal header section refers to the header of of the dialog
		this._modalHeaderSection = $().div({ class: 'modal-header' }, (modalHeader) => {
			modalHeader.element('button',
				{ type: 'button', class: 'close', 'data-dismiss': 'modal', 'aria-label': 'close', 'aria-hidden': 'true' },
				(menuCloseButton) => {
					this._closeButtonInHeader = menuCloseButton;
					menuCloseButton.innerHtml('&times;');
				});

			this._modalHeader = modalHeader;
		});

		// This modal body section refers to the body of of the dialog
		this._modalBodySection = $().div({ class: modalBodyClass, id: this._bodyId }, (modelBody) => {
			this._modalBody = modelBody;
		});

		// This modal footer section refers to the footer of of the dialog
		if (isAngularComponent === false) {
			this._modalFooterSection = $().div({ class: 'modal-footer' }, (modelFooter) => {
				modelFooter.div({ 'class': 'footer-spinner' }, (spinnerContainer) => {
					spinnerContainer.element('img', { 'class': 'hiddenSpinner' }, (spinnerElement) => {
						this._spinnerElement = spinnerElement.getHTMLElement();
					});
				});
				this._footerBuilder = modelFooter;
			});
		}

		let builderClass = 'modal fade';
		if (flyout) {
			builderClass += ' flyout-dialog';
		}

		// The builder builds the dialog. It append header, body and footer sections.
		this._builder = $().div({ class: builderClass, 'role': 'dialog' }, (dialogContainer) => {
			this._modalDialog = dialogContainer.div({ class: 'modal-dialog ', role: 'document' }, (modalDialog) => {
				modalDialog.div({ class: 'modal-content' }, (modelContent) => {
					modelContent.append(this._modalHeaderSection);
					modelContent.append(this._modalBodySection);
					if (isAngularComponent === false) {
						modelContent.append(this._modalFooterSection);
					}
				});
			});
		})
			.addClass(this._class);
		return this._builder;
	}

	public get bodyContainer(): Builder {
		return this._modalBody;
	}

	public get headerContainer(): Builder {
		return this._modalHeader;
	}

	public get footerContainer(): Builder {
		return this._footerBuilder;
	}

	public showError(err: string) {
		if (err === '') {
			this._errorIconElement.style.visibility = 'hidden';
		} else {
			this._errorIconElement.style.visibility = 'visible';
		}
		this._errorMessageLabel.setValue(err);
	}

	public showSpinner(): void {
		this._spinnerElement.setAttribute('class', 'spinner');
	}

	public addModalTitle() {
		this._modalHeader.div({ class: 'modal-title' }, (modalTitle) => {
			this._modalTitle = modalTitle;
			modalTitle.innerHtml(this._title);
		});
	}

	public setDialogTitle(title: string) {
		this._title = title;
		if (this._modalTitle) {
			this._modalTitle.innerHtml(this._title);
		}
	}

	public addErrorMessage(): void {
		this._modalBody.div({ class: 'dialogErrorMessage', id: 'dialogErrorMessage' }, (errorMessageContainer) => {
			errorMessageContainer.div({ class: 'errorIcon' }, (iconContainer) => {
				iconContainer.element('img', { 'class': 'error-icon' });
				this._errorIconElement = iconContainer.getHTMLElement();
				let iconFilePath = require.toUrl('sql/parts/common/flyoutDialog/media/status-error.svg');
				this._errorIconElement.style.content = 'url(' + iconFilePath + ')';
				this._errorIconElement.style.visibility = 'hidden';
			});
			errorMessageContainer.div({ class: 'errorMessage' }, (messageContainer) => {
				this._errorMessageLabel = new IconLabel(messageContainer.getHTMLElement());
			});
		});
	}

	public hideSpinner(): void {
		this._spinnerElement.setAttribute('class', 'hiddenSpinner');
	}

	public style(styles: IModalDialogStyles): void {
		this._dialogForeground = styles.dialogForeground;
		this._dialogBorder = styles.dialogBorder;
		this._dialogHeaderAndFooterBackground = styles.dialogHeaderAndFooterBackground;
		this._dialogBodyBackground = styles.dialogBodyBackground;
		this.applyStyles();
	}

	private applyStyles(): void {
		const foreground = this._dialogForeground ? this._dialogForeground.toString() : null;
		const border = this._dialogBorder ? this._dialogBorder.toString() : null;
		const headerAndFooterBackground = this._dialogHeaderAndFooterBackground ? this._dialogHeaderAndFooterBackground.toString() : null;
		const bodyBackground = this._dialogBodyBackground ? this._dialogBodyBackground.toString() : null;

		if (this._closeButtonInHeader) {
			this._closeButtonInHeader.style('color', foreground);
		}
		if (this._modalDialog) {
			this._modalDialog.style('color', foreground);
			this._modalDialog.style('border-width', border ? '1px' : null);
			this._modalDialog.style('border-style', border ? 'solid' : null);
			this._modalDialog.style('border-color', border);
		}
		if (this._modalHeaderSection) {
			this._modalHeaderSection.style('background-color', headerAndFooterBackground);
			this._modalHeaderSection.style('border-bottom-width', border ? '1px' : null);
			this._modalHeaderSection.style('border-bottom-style', border ? 'solid' : null);
			this._modalHeaderSection.style('border-bottom-color', border);
		}

		if (this._modalBodySection) {
			this._modalBodySection.style('background-color', bodyBackground);
		}

		if (this._modalFooterSection) {
			this._modalFooterSection.style('background-color', headerAndFooterBackground);
			this._modalFooterSection.style('border-top-width', border ? '1px' : null);
			this._modalFooterSection.style('border-top-style', border ? 'solid' : null);
			this._modalFooterSection.style('border-top-color', border);
		}
	}
}
