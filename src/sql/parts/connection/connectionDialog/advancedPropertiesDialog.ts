/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/bootstrap';
import 'vs/css!./media/bootstrap-theme';
import 'vs/css!./media/advancedProperties';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Widget } from 'vs/base/browser/ui/widget';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { SplitView, FixedCollapsibleView, CollapsibleState } from 'vs/base/browser/ui/splitview/splitview';
import * as lifecycle from 'vs/base/common/lifecycle';
import { ConnectionOptionType } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import data = require('data');
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';

export interface IAdvancedDialogCallbacks {
	onOk: () => void;
	onCancel: () => void;
	onClose: () => void;
}

interface IAdvancedPropertyElement {
	advancedPropertyWidget: any;
	advancedProperty: data.ConnectionOption;
	propertyValue: any;
}

class OptionPropertiesView extends FixedCollapsibleView {
	private _treecontainer: HTMLElement;
	constructor(private viewTitle: string, private _bodyContainer: HTMLElement, collapsed: boolean, initialBodySize: number, headerSize: number) {
		super({
			expandedBodySize: initialBodySize,
			headerSize: headerSize,
			initialState: collapsed ? CollapsibleState.COLLAPSED : CollapsibleState.EXPANDED,
			ariaHeaderLabel: viewTitle
		});
	}

	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(this.viewTitle).appendTo(titleDiv);
	}

	public renderBody(container: HTMLElement): void {
		this._treecontainer = document.createElement('div');
		container.appendChild(this._treecontainer);
		this._treecontainer.appendChild(this._bodyContainer);
	}

	public layoutBody(size: number): void {
		this._treecontainer.style.height = size + 'px';
	}
}

export class AdvancedPropertiesDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _modelElement: HTMLElement;
	private _callbacks: IAdvancedDialogCallbacks;
	private _okButton: Button;
	private _closeButton: Button;
	private _trueInputValue: string = 'True';
	private _falseInputValue: string = 'False';
	private _toDispose: lifecycle.IDisposable[];
	private _advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement };
	private _propertyTitle: Builder;
	private _propertyDescription: Builder;
	private _dialog: ModalDialogBuilder;
	private _options: { [name: string]: any };
	private _propertyRowSize = 31;
	private _propertyCategoryPadding = 30;
	private _categoryHeaderSize = 22;

	constructor(container: HTMLElement, callbacks: IAdvancedDialogCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];
		this._advancedPropertiesMap = {};
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('advancedDialogModal', 'Advanced Properties', 'advanced-dialog', 'advancedBody');
		this._builder = this._dialog.create();
		this._dialog.bodyContainer.div({class:'advancedDialog-properties', id: 'propertiesContent'});
		this._dialog.addErrorMessage();
		this._dialog.bodyContainer.div({class:'advancedDialog-description'}, (descriptionContainer) => {
			descriptionContainer.div({class:'modal-title'}, (propertyTitle) => {
				this._propertyTitle = propertyTitle;
			});
			descriptionContainer.div({ class: 'advancedDialog-description-content' }, (propertyDescription) => {
				this._propertyDescription = propertyDescription;
			});
		});
		this.createBackButton(this._dialog.headerContainer);
		this._dialog.addModalTitle();
		this._okButton = this.createFooterButton(this._dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Go Back');

		this._builder.build(this._container);
		this._modelElement = this._builder.getHTMLElement();

		return this._modelElement;
	}

	private onAdvancedPropertyLinkClicked(propertyName: string): void {
		var property = this._advancedPropertiesMap[propertyName].advancedProperty;
		this._propertyTitle.innerHtml(property.displayName);
		this._propertyDescription.innerHtml(property.description);
	}

	private fillInProperties(container: Builder, connectionOptions: data.ConnectionOption[]): void {
		for (var i = 0; i < connectionOptions.length; i++) {
			var property: data.ConnectionOption = connectionOptions[i];
			var rowContainer = ConnectionDialogHelper.appendRow(container, property.displayName, 'advancedDialog-label', 'advancedDialog-input');
			this.createAdvancedProperty(property, rowContainer);
		}
	}

	private createAdvancedProperty(property: data.ConnectionOption, rowContainer: Builder): void {
		var optionValue = property.defaultValue;
		if (this._options[property.name]) {
			optionValue = this._options[property.name];
		}
		var propertyWidget: any;
		var inputElement: HTMLElement;
		switch (property.valueType) {
			case ConnectionOptionType.number:
				propertyWidget = ConnectionDialogHelper.appendInputBox(rowContainer, {
					validationOptions: {
						validation: (value: string) => !ConnectionDialogHelper.isNumeric(value) ? ({ type: MessageType.ERROR, content: 'Invalid input.  Numeric value expected.' }) : null
					}
				});
				propertyWidget.value = optionValue;
				inputElement = this.findElement(rowContainer, 'input');
				break;
			case ConnectionOptionType.category:
			case ConnectionOptionType.boolean:
				let categoryValues: string[];
				let possibleInputs= [];
				if (property.valueType === ConnectionOptionType.boolean) {
					categoryValues = [this._trueInputValue, this._falseInputValue];
				} else {
					categoryValues = property.categoryValues.map(c => c.name);
				}
				if (optionValue === null || optionValue === undefined) {
					if (property.isRequired) {
						optionValue = categoryValues[0];
					} else {
						optionValue = '';
						possibleInputs.push('');
					}
				}
				categoryValues.forEach(v => possibleInputs.push(v));
				propertyWidget = new ConnectionDialogSelectBox(possibleInputs, optionValue.toString());
				ConnectionDialogHelper.appendInputSelectBox(rowContainer, propertyWidget);
				inputElement = this.findElement(rowContainer, 'select-box');
				break;
			case ConnectionOptionType.string:
			case ConnectionOptionType.password:
				propertyWidget = ConnectionDialogHelper.appendInputBox(rowContainer);
				propertyWidget.value = optionValue;
				if (property.valueType === ConnectionOptionType.password) {
					propertyWidget.inputElement.type = 'password';
				}
				inputElement = this.findElement(rowContainer, 'input');
		}
		this._advancedPropertiesMap[property.name] = { advancedPropertyWidget: propertyWidget, advancedProperty: property, propertyValue: optionValue };
		inputElement.onfocus = () => this.onAdvancedPropertyLinkClicked(property.name);
	}

	private findElement(container: Builder, className: string): HTMLElement {
		var elementBuilder: Builder = container;
		while (elementBuilder.getHTMLElement()) {
			var htmlElement = elementBuilder.getHTMLElement();
			if (htmlElement.className === className) {
				break;
			}
			elementBuilder = elementBuilder.child(0);
		}
		return elementBuilder.getHTMLElement();
	}

	private createBackButton(container: Builder): void {
		container.div({ class: 'modal-go-back' }, (cellContainer) => {
			let button = new Button(cellContainer);
			button.icon = 'backButtonIcon';
			button.addListener2('click', () => {
				this.cancel();
			});
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
				} else {
					this.cancel();
				}
			});
		});

		return button;
	}

	public get options(): { [name: string]: string } {
		return this._options;
	}

	private updateProperties(): void {
		for (var key in this._advancedPropertiesMap) {
			var propertyElement: IAdvancedPropertyElement = this._advancedPropertiesMap[key];
			if (propertyElement.advancedPropertyWidget.value !== propertyElement.propertyValue) {
				if (ConnectionDialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value) && this._options[key]) {
					delete this._options[key];
				}
				if (!ConnectionDialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value)) {
					if (propertyElement.advancedProperty.valueType === ConnectionOptionType.boolean) {
						this._options[key] = (propertyElement.advancedPropertyWidget.value === this._trueInputValue) ? true : false;
					} else {
						this._options[key] = propertyElement.advancedPropertyWidget.value;
					}
				}
			}
		}
	}

	private validateInputs(): string {
		let errorMsg = '';
		let missingInputMsg = ': Cannot be empty.\n';
		let requiredNumberInput = ': Requires number as an input.\n';
		for (var key in this._advancedPropertiesMap) {
			var propertyElement: IAdvancedPropertyElement = this._advancedPropertiesMap[key];
			var widget = propertyElement.advancedPropertyWidget;
			var isInputBox = (propertyElement.advancedProperty.valueType === ConnectionOptionType.string ||
				propertyElement.advancedProperty.valueType === ConnectionOptionType.password ||
				propertyElement.advancedProperty.valueType === ConnectionOptionType.number );

			if (propertyElement.advancedProperty.valueType === ConnectionOptionType.number) {
				if (!widget.isInputValid()) {
					errorMsg += propertyElement.advancedProperty.displayName + requiredNumberInput;
				}
			}
			if (propertyElement.advancedProperty.isRequired && ConnectionDialogHelper.isEmptyString(widget.value) && isInputBox) {
				widget.showMessage({ type: MessageType.ERROR, content: 'Missing required input.' });
				errorMsg += propertyElement.advancedProperty.displayName + missingInputMsg;
			}
		}
		return errorMsg;
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	public ok(): void {
		var errorMsg = this.validateInputs();
		if (ConnectionDialogHelper.isEmptyString(errorMsg)) {
			this.updateProperties();
			this._callbacks.onOk();
			this.close();
		} else {
			this.showError(errorMsg);
		}

	}

	public cancel() {
		this._callbacks.onCancel();
		this.close();
	}

	public close() {
		jQuery('#propertiesContent').empty();
		this.dispose();
		jQuery('#advancedDialogModal').modal('hide');
		this._callbacks.onClose();
	}

	public open(connectionPropertiesMaps: { [category: string]:  data.ConnectionOption[] }, options: { [name: string]: any }) {
		this._options = options;
		var firstProperty: string;
		var containerGroup: Builder;
		var layoutSize = 0;
		var propertiesContentbuilder: Builder = $().div({ class: 'advancedDialog-properties-groups' }, (container) => {
			containerGroup = container;
		});
		var splitview = new SplitView(containerGroup.getHTMLElement());
		for (var category in connectionPropertiesMaps) {
			var propertyOptions: data.ConnectionOption[] = connectionPropertiesMaps[category];
			var bodyContainer = $().element('table', { class: 'advancedDialog-table' }, (tableContainer: Builder) => {
				this.fillInProperties(tableContainer, propertyOptions);
			});

			var viewSize = this._propertyCategoryPadding + propertyOptions.length * this._propertyRowSize;
			layoutSize += (viewSize + this._categoryHeaderSize);
			var categoryView = new OptionPropertiesView(category, bodyContainer.getHTMLElement(), false, viewSize, this._categoryHeaderSize);
			splitview.addView(categoryView);

			if (!firstProperty) {
				firstProperty = propertyOptions[0].name;
			}
		}
		splitview.layout(layoutSize);
		jQuery('#propertiesContent').append(propertiesContentbuilder.getHTMLElement());
		jQuery('#advancedDialogModal').modal({ backdrop: false, keyboard: true });
		var firstPropertyWidget = this._advancedPropertiesMap[firstProperty].advancedPropertyWidget;
		firstPropertyWidget.focus();

		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.ok();
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			}
		});
	}

	public dispose(): void {
		this._builder.off(DOM.EventType.KEY_DOWN);
		this._toDispose = lifecycle.dispose(this._toDispose);
		for (var key in this._advancedPropertiesMap) {
			var widget: Widget = this._advancedPropertiesMap[key].advancedPropertyWidget;
			widget.dispose();
			delete this._advancedPropertiesMap[key];
		}
	}
}