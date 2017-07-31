/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/parts/common/modal/media/modal';
import { IThemable } from 'vs/platform/theme/common/styler';
import { Color } from 'vs/base/common/color';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { KeyCode } from 'vs/base/common/keyCodes';
import { mixin } from 'vs/base/common/objects';

/* Bad Layering */
import { Builder, $, withElementById } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import * as DOM from 'vs/base/browser/dom';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';

export interface IModalDialogStyles {
	dialogForeground?: Color;
	dialogBorder?: Color;
	dialogHeaderAndFooterBackground?: Color;
	dialogBodyBackground?: Color;
}

export interface IModalOptions {
	isFlyout?: boolean;
	isWide?: boolean;
	isAngular?: boolean;
	hasBackButton?: boolean;
	hasErrors?: boolean;
	hasSpinner?: boolean;
}

// Needed for angular component dialogs to style modal footer
export class modalFooterStyle {
	public static backgroundColor;
	public static borderTopWidth;
	public static borderTopStyle;
	public static borderTopColor;
}

const defaultOptions: IModalOptions = {
	isFlyout: true,
	isWide: false,
	isAngular: false,
	hasBackButton: false,
	hasErrors: false,
	hasSpinner: false
};

export abstract class Modal implements IThemable {

	private _errorMessage: Builder;
	private _spinnerElement: HTMLElement;
	private _errorIconElement: HTMLElement;
	private _dialogForeground: Color;
	private _dialogBorder: Color;
	private _dialogHeaderAndFooterBackground: Color;
	private _dialogBodyBackground: Color;

	private _modalDialog: Builder;
	private _modalHeaderSection: Builder;
	private _modalBodySection: HTMLElement;
	private _modalFooterSection: Builder;
	private _closeButtonInHeader: Builder;
	private _builder: Builder;
	private _footerBuilder: Builder;
	private _modalTitle: Builder;
	private _leftFooter: Builder;
	private _rightFooter: Builder;

	private _modalOptions: IModalOptions;
	private _backButton: Button;
	/**
	 * Get the back button, only available after render and if the hasBackButton option is true
	 */
	protected get backButton(): Button {
		return this._backButton;
	}

	/**
	 * Constructor for modal
	 * @param _title Title of the modal, if undefined, the title section is not rendered
	 * @param _partService
	 * @param options Modal options
	 */
	constructor(
		private _title: string,
		private _partService: IPartService,
		options?: IModalOptions
	) {
		this._modalOptions = options || Object.create(null);
		mixin(this._modalOptions, defaultOptions, false);
	}

	/**
	 * Build and render the modal, will call {@link Modal#renderBody}
	 */
	public render() {
		let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
		let modalBodyClass = (this._modalOptions.isAngular === false ? 'modal-body' : 'modal-body-and-footer');

		let parts: Array<HTMLElement> = [];
		// This modal header section refers to the header of of the dialog
		// will not be rendered if the title is passed in as undefined
		if (this._title !== undefined) {
			this._modalHeaderSection = $().div({ class: 'modal-header' }, (modalHeader) => {
				if (this._modalOptions.hasBackButton) {
					modalHeader.div({ class: 'modal-go-back' }, (cellContainer) => {
						this._backButton = new Button(cellContainer);
						this._backButton.icon = 'backButtonIcon';
					});
				}
				modalHeader.div({ class: 'modal-title' }, (modalTitle) => {
					this._modalTitle = modalTitle;
					modalTitle.innerHtml(this._title);
				});
			});
			parts.push(this._modalHeaderSection.getHTMLElement());
		}

		// This modal body section refers to the body of of the dialog
		let body: Builder;
		$().div({ class: modalBodyClass }, (builder) => {
			body = builder;
		});
		this._modalBodySection = body.getHTMLElement();
		parts.push(body.getHTMLElement());

		this.renderBody(body.getHTMLElement());

		if (this._modalOptions.isAngular === false && this._modalOptions.hasErrors) {
			body.div({ class: 'dialogErrorMessage', id: 'dialogErrorMessage' }, (errorMessageContainer) => {
				errorMessageContainer.div({ class: 'errorIcon' }, (iconContainer) => {
					iconContainer.element('img', { 'class': 'error-icon' });
					this._errorIconElement = iconContainer.getHTMLElement();
					let iconFilePath = require.toUrl('sql/parts/common/modal/media/status-error.svg');
					this._errorIconElement.style.content = 'url(' + iconFilePath + ')';
					this._errorIconElement.style.visibility = 'hidden';
				});
				errorMessageContainer.div({ class: 'errorMessage' }, (messageContainer) => {
					this._errorMessage = messageContainer;
				});
			});
		}
		// This modal footer section refers to the footer of of the dialog
		if (this._modalOptions.isAngular === false) {
			this._modalFooterSection = $().div({ class: 'modal-footer' }, (modelFooter) => {
				if (this._modalOptions.hasSpinner) {
					modelFooter.div({ 'class': 'footer-spinner' }, (spinnerContainer) => {
						spinnerContainer.element('img', { 'class': 'hiddenSpinner' }, (spinnerElement) => {
							this._spinnerElement = spinnerElement.getHTMLElement();
						});
					});
				}
				modelFooter.div({ 'class': 'left-footer' }, (leftFooter) => {
					this._leftFooter = leftFooter;
				});
				modelFooter.div({ 'class': 'right-footer' }, (rightFooter) => {
					this._rightFooter = rightFooter;
				});
				this._footerBuilder = modelFooter;
			});
			parts.push(this._modalFooterSection.getHTMLElement());
		}

		let builderClass = 'modal fade';
		if (this._modalOptions.isFlyout) {
			builderClass += ' flyout-dialog';
		}
		if (this._modalOptions.isWide) {
			builderClass += ' wide';
		}

		// The builder builds the dialog. It append header, body and footer sections.
		this._builder = $(container).div({ class: builderClass, 'role': 'dialog' }, (dialogContainer) => {
			this._modalDialog = dialogContainer.div({ class: 'modal-dialog ', role: 'document' }, (modalDialog) => {
				modalDialog.div({ class: 'modal-content' }, (modelContent) => {
					parts.forEach((part) => {
						modelContent.append(part);
					});
				});
			});
		});
		this._builder.hide();

		jQuery(this._builder.getHTMLElement()).modal({ backdrop: false, keyboard: false });
	}

	/**
	 * Called for extended classes to render the body
	 * @param container The parent container to attach the rendered body to
	 */
	protected abstract renderBody(container: HTMLElement): void;

	/**
	 * Overridable to change behavior of escape key
	 */
	protected onClose(e: StandardKeyboardEvent) {
		this.hide();
	}

	/**
	 * Overridable to change behavior of enter key
	 */
	protected onAccept(e: StandardKeyboardEvent) {
		this.hide();
	}

	/**
	 * Shows the modal and attachs key listeners
	 */
	protected show() {
		this._builder.show();

		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.onAccept(event);
			} else if (event.equals(KeyCode.Escape)) {
				this.onClose(event);
			}
		});
	}

	/**
	 * Hides the modal and removes key listeners
	 */
	protected hide() {
		this._builder.hide();
		this._builder.off(DOM.EventType.KEY_DOWN);
	}

	/**
	 * Adds a button to the footer of the modal
	 * @param label Label to show on the button
	 * @param onSelect The callback to call when the button is selected
	 */
	protected addFooterButton(label: string, onSelect: () => void, orientation: 'left' | 'right' = 'right'): Button {
		let footerButton = $('div.footer-button');
		let button = new Button(footerButton);
		button.label = label;
		button.addListener('click', () => onSelect());
		if (orientation === 'left') {
			footerButton.appendTo(this._leftFooter);
		} else {
			footerButton.appendTo(this._rightFooter);
		}
		return button;
	}

	/**
	 * Show an error in the error message element
	 * @param err Text to show in the error message
	 */
	protected setError(err: string) {
		if (this._modalOptions.hasErrors) {
			if (err === '') {
				this._errorIconElement.style.visibility = 'hidden';
			} else {
				this._errorIconElement.style.visibility = 'visible';
			}
			this._errorMessage.innerHtml(err);
		}
	}

	/**
	 * Show the spinner element that shows something is happening, hidden by default
	 */
	protected showSpinner(): void {
		if (this._modalOptions.hasSpinner) {
			this._spinnerElement.setAttribute('class', 'spinner');
		}
	}

	/**
	 * Hide the spinner element to show that something was happening, hidden by default
	 */
	protected hideSpinner(): void {
		if (this._modalOptions.hasSpinner) {
			this._spinnerElement.setAttribute('class', 'hiddenSpinner');
		}
	}

	/**
	 * Set the title of the modal
	 * @param title
	 */
	protected set title(title: string) {
		if (this._title !== undefined) {
			this._modalTitle.innerHtml(title);
		}
	}

	/**
	 * Called by the theme registry on theme change to style the component
	 */
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
		modalFooterStyle.backgroundColor = headerAndFooterBackground;
		modalFooterStyle.borderTopWidth = border ? '1px' : null;
		modalFooterStyle.borderTopStyle = border ? 'solid' : null;
		modalFooterStyle.borderTopColor = border;

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
			this._modalBodySection.style.backgroundColor = bodyBackground;
		}

		if (this._modalFooterSection) {
			this._modalFooterSection.style('background-color', modalFooterStyle.backgroundColor);
			this._modalFooterSection.style('border-top-width', modalFooterStyle.borderTopWidth);
			this._modalFooterSection.style('border-top-style', modalFooterStyle.borderTopStyle);
			this._modalFooterSection.style('border-top-color', modalFooterStyle.borderTopColor);
		}
	}
}
