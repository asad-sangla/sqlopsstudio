/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { DialogHelper } from 'sql/parts/common/flyoutDialog/dialogHelper';
import { Builder } from 'vs/base/browser/builder';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { DialogSelectBox } from 'sql/parts/common/flyoutDialog/dialogSelectBox';
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
			case ServiceOptionType.number:
				propertyWidget = DialogHelper.appendInputBox(rowContainer, {
					validationOptions: {
						validation: (value: string) => !DialogHelper.isNumeric(value) ? ({ type: MessageType.ERROR, content: 'Invalid input.  Numeric value expected.' }) : null
					}
				});
				propertyWidget.value = optionValue;
				inputElement = this.findElement(rowContainer, 'input');
				break;
			case ServiceOptionType.category:
			case ServiceOptionType.boolean:
				propertyWidget = new DialogSelectBox(possibleInputs, optionValue.toString());
				DialogHelper.appendInputSelectBox(rowContainer, propertyWidget);
				inputElement = this.findElement(rowContainer, 'select-box');
				break;
			case ServiceOptionType.string:
			case ServiceOptionType.password:
				propertyWidget = DialogHelper.appendInputBox(rowContainer);
				propertyWidget.value = optionValue;
				if (property.valueType === ServiceOptionType.password) {
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
			if (property.valueType === ServiceOptionType.boolean) {
				if (options[property.name] === true || options[property.name] === this.trueInputValue) {
					optionValue = this.trueInputValue;
				} else {
					optionValue = this.falseInputValue;
				}
			} else {
				optionValue = options[property.name];
			}
		}

		if (property.valueType === ServiceOptionType.boolean || property.valueType === ServiceOptionType.category) {
			// If the property is not required, the empty string should be add at the top of possible options
			if (!property.isRequired) {
				possibleInputs.push('');
			}

			if (property.valueType === ServiceOptionType.boolean) {
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
			var isInputBox = (propertyElement.advancedProperty.valueType === ServiceOptionType.string ||
				propertyElement.advancedProperty.valueType === ServiceOptionType.password ||
				propertyElement.advancedProperty.valueType === ServiceOptionType.number);

			if (propertyElement.advancedProperty.valueType === ServiceOptionType.number) {
				if (!widget.isInputValid()) {
					errorMsg += propertyElement.advancedProperty.displayName + requiredNumberInput;
				}
			}
			if (propertyElement.advancedProperty.isRequired && DialogHelper.isEmptyString(widget.value) && isInputBox) {
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
				if (DialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value) && options[key]) {
					delete options[key];
				}
				if (!DialogHelper.isEmptyString(propertyElement.advancedPropertyWidget.value)) {
					if (propertyElement.advancedProperty.valueType === ServiceOptionType.boolean) {
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