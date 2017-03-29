/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import { Builder } from 'vs/base/browser/builder';
import { ConnectionOptionType } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import data = require('data');

export interface IAdvancedPropertyElement {
	advancedPropertyWidget: any;
	advancedProperty: data.ConnectionOption;
	propertyValue: any;
}

export class AdvancedPropertiesHelper {
	static createAdvancedProperty(property: data.ConnectionOption, rowContainer: Builder, options: { [name: string]: any }, advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement }, onFocus: (name) => void): void {
		var possibleInputs: string[] = [];
		var optionValue = this.getPropertyValueAndCategorieValues(property, options, possibleInputs);
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
		advancedPropertiesMap[property.name] = { advancedPropertyWidget: propertyWidget, advancedProperty: property, propertyValue: optionValue };
		inputElement.onfocus = () => onFocus(property.name);
	}

	static getPropertyValueAndCategorieValues(property: data.ConnectionOption, options: { [name: string]: any }, possibleInputs: string[]): any {
		var optionValue = property.defaultValue;
		if (options[property.name]) {
			// if the value type is boolean, the option value can be either boolean or string
			if (property.valueType === ConnectionOptionType.boolean) {
				if (options[property.name] === true || options[property.name] === this.trueInputValue) {
					optionValue = this.trueInputValue;
				} else {
					optionValue = this.falseInputValue;
				}
			} else {
				optionValue = options[property.name];
			}
		}

		if (property.valueType === ConnectionOptionType.boolean || property.valueType === ConnectionOptionType.category) {
			// If the property is not required, the empty string should be add at the top of possible options
			if (!property.isRequired) {
				possibleInputs.push('');
			}

			if (property.valueType === ConnectionOptionType.boolean) {
				possibleInputs.push(this.trueInputValue, this.falseInputValue);
			} else {
				property.categoryValues.map(c => possibleInputs.push(c.name));
			}

			// If the option value is not set and default value is null, the option value should be set to the first possible input.
			if (optionValue === null || optionValue === undefined) {
				optionValue = possibleInputs[0];
			}
		}
		return optionValue;
	}

	static validateInputs(advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement }): string {
		let errorMsg = '';
		let missingInputMsg = ': Cannot be empty.\n';
		let requiredNumberInput = ': Requires number as an input.\n';
		for (var key in advancedPropertiesMap) {
			var propertyElement: IAdvancedPropertyElement = advancedPropertiesMap[key];
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

	static updateProperties(options: { [name: string]: any }, advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement }): void {
		for (var key in advancedPropertiesMap) {
			var propertyElement: IAdvancedPropertyElement = advancedPropertiesMap[key];
			if (propertyElement.advancedPropertyWidget.value !== propertyElement.propertyValue) {
				if (ConnectionDialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value) && options[key]) {
					delete options[key];
				}
				if (!ConnectionDialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value)) {
					if (propertyElement.advancedProperty.valueType === ConnectionOptionType.boolean) {
						options[key] = (propertyElement.advancedPropertyWidget.value === this.trueInputValue) ? true : false;
					} else {
						options[key] = propertyElement.advancedPropertyWidget.value;
					}
				}
			}
		}
	}

	static get trueInputValue(): string {
		return 'True';
	}

	static get falseInputValue(): string {
		return 'False';
	}

	static findElement(container: Builder, className: string): HTMLElement {
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
}