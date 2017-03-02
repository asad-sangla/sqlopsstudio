/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Builder, $ } from 'vs/base/browser/builder';
import { IconLabel } from 'vs/base/browser/ui/iconLabel/iconLabel';

export class ModalDialogBuilder {

	private _builder: Builder;
	private _footerBuilder: Builder;
	private _modelBody: Builder;
	private _errorMessageLabel: IconLabel;
	private _spinnerElement: HTMLElement;

	constructor(private _id: string,
		private _title: string,
		private _class: string,
		private _bodyId: string
	) {
	}

	public create(): Builder {
		this._builder = $().div({}, (div: Builder) => {
			div.div({ class: 'modal fade', id: this._id, 'role': 'dialog' }, (dialogContainer) => {
				dialogContainer.div({ class: 'modal-dialog ', role: 'document' }, (modalDialog) => {
					modalDialog.div({ class: 'modal-content' }, (modelContent) => {
						modelContent.div({ class: 'modal-header' }, (modalHeader) => {
							modalHeader.element('button',
								{ type: 'button', class: 'close', 'data-dismiss': 'modal', 'aria-label': 'close', 'aria-hidden': 'true' },
								(menuCloseButton) => {
									menuCloseButton.innerHtml('&times;');
								});
							modalHeader.div({ class: 'modal-title' }, (modalTitle) => {
								modalTitle.innerHtml(this._title);
							});
						});
						modelContent.div({ class: 'modal-body', id: this._bodyId }, (modelBody) => {

							this._modelBody = modelBody;
						});
						modelContent.div({ class: 'modal-footer' }, (modelFooter) => {
							modelFooter.element('table', { class: 'footer-buttons', align: 'right' }, (tableContainer) => {
								tableContainer.element('tr', {}, (rowContainer) => {
									this._footerBuilder = rowContainer;
									rowContainer.element('td', { class: 'footer-spinner' }, (cellContainer) => {
										cellContainer.element('img', { 'class': 'hiddenSpinner' }, (spinnerElement) => {
											this._spinnerElement = spinnerElement.getHTMLElement();
										});
									});
								});
							});
						});
					});
				});
			});
		})
		.addClass(this._class);
		return this._builder;
	}

	public get bodyContainer(): Builder {
		return this._modelBody;
	}

	public get footerContainer(): Builder {
		return this._footerBuilder;
	}

	public showError(err: string) {
		this._errorMessageLabel.setValue(err);
	}

	public showSpinner(): void {
		this._spinnerElement.setAttribute('class', 'spinner');
	}

	public addErrorMessage(): void {
		this._modelBody.div({ class: 'dialogErrorMessage', id: 'dialogErrorMessage' }, (errorMessageContainer) => {
			this._errorMessageLabel = new IconLabel(errorMessageContainer.getHTMLElement());
		});
	}

	public hideSpinner(): void {
		this._spinnerElement.setAttribute('class', 'hiddenSpinner');
	}
}
