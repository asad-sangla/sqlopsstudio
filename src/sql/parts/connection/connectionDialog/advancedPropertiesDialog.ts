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
import * as lifecycle from 'vs/base/common/lifecycle';
import { ConnectionPropertyType } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import vscode = require('vscode');
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';

export interface IAdvancedDialogCallbacks {
	onOk: () => void;
	onCancel: () => void;
}

interface IAdvancedPropertyElement {
	advancedPropertyWidget: any;
	advancedProperty: vscode.ConnectionProperty;
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
	private _connectionProperties: vscode.ConnectionProperty[];
	private _advancedPropertiesMaps: { [propertyName: string]: IAdvancedPropertyElement };
	private _isDisposed: boolean;

	constructor(container: HTMLElement, callbacks: IAdvancedDialogCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];
		this._advancedPropertiesMaps = {};
		this._isDisposed = false;
	}

	public create(): HTMLElement {
		let dialog = new ModalDialogBuilder('advancedDialogModal', 'Advanced Properties', 'advanced-dialog', 'propertiesContent');
		this._builder = dialog.create();
		this._okButton = this.createFooterButton(dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(dialog.footerContainer, 'Cancel');

		this._builder.build(this._container);
		this._modelElement = this._builder.getHTMLElement();
		return this._modelElement;
	}

	private fillInProperties(container: Builder): void {
		for (var i = 0; i < this._connectionProperties.length; i++) {

			var property: vscode.ConnectionProperty = this._connectionProperties[i];
			var propertyWidget: any;
			switch (property.propertyType) {
				case ConnectionPropertyType.boolean:
					propertyWidget = new ConnectionDialogSelectBox([this._trueInputValue, this._falseInputValue], property.propertyValue ? this._trueInputValue : this._falseInputValue);
					ConnectionDialogHelper.appendInputSelectBox(ConnectionDialogHelper.appendRow(container, property.propertyName, 'advancedDialog-label', 'advancedDialog-input'), propertyWidget);
					break;
				case ConnectionPropertyType.number:
					propertyWidget = ConnectionDialogHelper.appendInputBox(ConnectionDialogHelper.appendRow(container, property.propertyName, 'advancedDialog-label', 'advancedDialog-input'));
					propertyWidget.value = property.propertyValue;
					this._toDispose.push(propertyWidget.onDidChange(newInput => {
						// TODO input validation
						this.numberInputBoxChanged(newInput);
					}));
					break;
				case ConnectionPropertyType.options:
					propertyWidget = new ConnectionDialogSelectBox(property.propertyOptions, property.propertyValue);
					ConnectionDialogHelper.appendInputSelectBox(ConnectionDialogHelper.appendRow(container, property.propertyName, 'advancedDialog-label', 'advancedDialog-input'), propertyWidget);
					break;
				case ConnectionPropertyType.string:
					propertyWidget = ConnectionDialogHelper.appendInputBox(ConnectionDialogHelper.appendRow(container, property.propertyName, 'advancedDialog-label', 'advancedDialog-input'));
					propertyWidget.value = property.propertyValue;
			}
			this._advancedPropertiesMaps[property.propertyName] = { advancedPropertyWidget: propertyWidget, advancedProperty: property };
		}
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
			propertyElement.advancedProperty.propertyValue = propertyElement.advancedPropertyWidget.value;
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
	}

	public open(connectionProperties: vscode.ConnectionProperty[]) {
		if(!this._isDisposed) {
			jQuery('#propertiesContent').empty();
			this.dispose();
		}
		this._connectionProperties = connectionProperties;
		var propertiesContentbuilder = $().element('table', { width: '100%' }, (tableContainer: Builder) => {
			this.fillInProperties(tableContainer);
		});
		jQuery('#propertiesContent').append(propertiesContentbuilder.getHTMLElement());
		jQuery('#advancedDialogModal').modal({ backdrop: true, keyboard: true });
		this._isDisposed = false;
	}

	public dispose(): void {
		if(!this._isDisposed) {
			this._toDispose = lifecycle.dispose(this._toDispose);
			for (var key in this._advancedPropertiesMaps) {
				var widget: Widget = this._advancedPropertiesMaps[key].advancedPropertyWidget;
				widget.dispose();
				delete this._advancedPropertiesMaps[key];
			}
			this._isDisposed = true;
		}
	}
}