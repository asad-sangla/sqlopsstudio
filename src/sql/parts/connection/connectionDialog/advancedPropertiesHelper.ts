/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { Builder } from 'vs/base/browser/builder';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import data = require('data');
import { localize } from 'vs/nls';

export interface IAdvancedPropertyElement {
	advancedPropertyWidget: any;
	advancedProperty: data.ConnectionOption;
	propertyValue: any;
}

export class AdvancedPropertiesHelper {
	static createAdvancedProperty(property: data.ConnectionOption, rowContainer: Builder, options: { [name: string]: any },
		advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement }, contextViewService: IContextViewService, onFocus: (name) => void): void {
		let possibleInputs: string[] = [];
		let optionValue = this.getPropertyValueAndCategorieValues(property, options, possibleInputs);
		let propertyWidget: any;
		let inputElement: HTMLElement;
		let missingErrorMessage = localize('missingRequireField', ' is required.');
		let invalidInputMessage = localize('invalidInput', 'Invalid input.  Numeric value expected.');
		switch (property.valueType) {
			case ServiceOptionType.number:
				propertyWidget = new DialogInputBox(rowContainer.getHTMLElement(), contextViewService, {
					validationOptions: {
						validation: (value: string) => {
							if (DialogHelper.isEmptyString(value) && property.isRequired) {
								return { type: MessageType.ERROR, content: property.displayName + missingErrorMessage };
							} else if (!DialogHelper.isNumeric(value)) {
								return { type: MessageType.ERROR, content: invalidInputMessage };
							} else {
								return null;
							}
						}
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
				propertyWidget = new DialogInputBox(rowContainer.getHTMLElement(), contextViewService, {
					validationOptions: {
						validation: (value: string) => (DialogHelper.isEmptyString(value) && property.isRequired) ? ({ type: MessageType.ERROR, content: property.displayName + missingErrorMessage }) : null
					}
				});
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

	static validateInputs(advancedPropertiesMap: { [propertyName: string]: IAdvancedPropertyElement }): boolean {
		let isValid = true;
		let isFocused = false;
		for (var key in advancedPropertiesMap) {
			var propertyElement: IAdvancedPropertyElement = advancedPropertiesMap[key];
			var widget = propertyElement.advancedPropertyWidget;
			var isInputBox = (propertyElement.advancedProperty.valueType === ServiceOptionType.string ||
				propertyElement.advancedProperty.valueType === ServiceOptionType.password ||
				propertyElement.advancedProperty.valueType === ServiceOptionType.number);

			if (isInputBox) {
				if (!widget.validate()) {
					isValid = false;
					if (!isFocused) {
						isFocused = true;
						widget.focus();
					}
				}
			}
		}
		return isValid;
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