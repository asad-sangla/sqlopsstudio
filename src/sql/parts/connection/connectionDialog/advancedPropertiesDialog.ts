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
}

class OptionPropertiesView extends FixedCollapsibleView {
	private _treecontainer: HTMLElement;
	constructor(private viewTitle: string, private _bodyContainer: HTMLElement, collapsed: boolean, initialBodySize: number,) {
		super({
			expandedBodySize: initialBodySize,
			headerSize: 22,
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
	private _advancedPropertiesMaps: { [propertyName: string]: IAdvancedPropertyElement };
	private _propertyTitle: Builder;
	private _propertyDescription: Builder;

	constructor(container: HTMLElement, callbacks: IAdvancedDialogCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];
		this._advancedPropertiesMaps = {};
	}

	public create(): HTMLElement {
		let dialog = new ModalDialogBuilder('advancedDialogModal', 'Advanced Properties', 'advanced-dialog', 'advancedBody');
		this._builder = dialog.create();
		dialog.bodyContainer.div({class:'advancedDialog-properties', id: 'propertiesContent'});
		dialog.bodyContainer.div({class:'advancedDialog-description'}, (descriptionContainer) => {
			descriptionContainer.div({class:'modal-title'}, (propertyTitle) => {
				this._propertyTitle = propertyTitle;
			});
			descriptionContainer.div({class:'advancedDialog-description-content'}, (propertyDescription) => {
				this._propertyDescription = propertyDescription;
			});
		});
		this.createBackButton(dialog.headerContainer);
		dialog.addModalTitle();
		this._okButton = this.createFooterButton(dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(dialog.footerContainer, 'Cancel');

		this._builder.build(this._container);
		this._modelElement = this._builder.getHTMLElement();

		return this._modelElement;
	}

	private onAdvancedPropertyLinkClicked(propertyName: string): void {
		var property = this._advancedPropertiesMaps[propertyName].advancedProperty;
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
		var propertyWidget: any;
		var inputElement: HTMLElement;
		switch (property.valueType) {
			case ConnectionOptionType.boolean:
				propertyWidget = new ConnectionDialogSelectBox([this._trueInputValue, this._falseInputValue], property.defaultValue ? this._trueInputValue : this._falseInputValue);
				ConnectionDialogHelper.appendInputSelectBox(rowContainer, propertyWidget);
				inputElement = this.findElement(rowContainer, 'select-box');
				break;
			case ConnectionOptionType.number:
				propertyWidget = ConnectionDialogHelper.appendInputBox(rowContainer);
				propertyWidget.value = property.defaultValue;
				this._toDispose.push(propertyWidget.onDidChange(newInput => {
					// TODO input validation
					this.numberInputBoxChanged(newInput);
				}));
				inputElement = this.findElement(rowContainer, 'input');
				break;
			case ConnectionOptionType.category:
				propertyWidget = new ConnectionDialogSelectBox(property.categoryValues, property.defaultValue);
				ConnectionDialogHelper.appendInputSelectBox(rowContainer, propertyWidget);
				inputElement = this.findElement(rowContainer, 'select-box');
				break;
			case ConnectionOptionType.string:
			case ConnectionOptionType.password:
				propertyWidget = ConnectionDialogHelper.appendInputBox(rowContainer);
				propertyWidget.value = property.defaultValue;
				if (property.valueType === ConnectionOptionType.password) {
					propertyWidget.inputElement.type = 'password';
				}
				inputElement = this.findElement(rowContainer, 'input');
		}
		this._advancedPropertiesMaps[property.name] = { advancedPropertyWidget: propertyWidget, advancedProperty: property };
		inputElement.onfocus = () => this.onAdvancedPropertyLinkClicked(property.name);
	}

	private findElement(container: Builder, className: string): HTMLElement {
		var elementBuilder: Builder = container;
		while (!!elementBuilder.getHTMLElement()) {
			var htmlElement = elementBuilder.getHTMLElement();
			if(htmlElement.className === className) {
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

	private updateProperties(): void {
		for (var key in this._advancedPropertiesMaps) {
			var propertyElement: IAdvancedPropertyElement = this._advancedPropertiesMaps[key];
			propertyElement.advancedProperty.defaultValue = propertyElement.advancedPropertyWidget.value;
		}
	}

	private numberInputBoxChanged(input): void {
		if (!ConnectionDialogHelper.isNumeric(input)) {
			// TODO show error box
		}
	}

	public ok(): void {
		this.updateProperties();
		this._callbacks.onOk();
		this.close();
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

	public open(connectionPropertiesMaps: { [category: string]:  data.ConnectionOption[] }) {
		var firstProperty: string;
		var containerGroup: Builder;
		var propertiesContentbuilder: Builder = $().div({class:'advancedDialog-properties-groups'}, (container) => {
			containerGroup = container;
		});
		var splitview = new SplitView(containerGroup.getHTMLElement());
		for (var category in connectionPropertiesMaps) {
			var propertyOptions: data.ConnectionOption[] = connectionPropertiesMaps[category];
			var bodyContainer = $().element('table', { class: 'advancedDialog-table' }, (tableContainer: Builder) => {
				this.fillInProperties(tableContainer, propertyOptions);
			});

			var viewSize = 20 + propertyOptions.length * 31;
			var categoryView = new OptionPropertiesView(category, bodyContainer.getHTMLElement(), false, viewSize);
			splitview.addView(categoryView);

			if (!firstProperty) {
				firstProperty = propertyOptions[0].name;
			}
		}
		splitview.layout(569);
		jQuery('#propertiesContent').append(propertiesContentbuilder.getHTMLElement());
		jQuery('#advancedDialogModal').modal({ backdrop: false, keyboard: true });
		var firstPropertyWidget = this._advancedPropertiesMaps[firstProperty].advancedPropertyWidget;
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
		for (var key in this._advancedPropertiesMaps) {
			var widget: Widget = this._advancedPropertiesMaps[key].advancedPropertyWidget;
			widget.dispose();
			delete this._advancedPropertiesMaps[key];
		}
	}
}