/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { Builder } from 'vs/base/browser/builder';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import * as types from 'vs/base/common/types';
import data = require('data');
import { localize } from 'vs/nls';

export interface IOptionElement {
	optionWidget: any;
	option: data.ServiceOption;
	optionValue: any;
}

export enum ServiceOptionType {
	string = 0,
	multistring = 1,
	password = 2,
	number = 3,
	category = 4,
	boolean = 5
}

export function createOptionElement(option: data.ServiceOption, rowContainer: Builder, options: { [name: string]: any },
	optionsMap: { [optionName: string]: IOptionElement }, contextViewService: IContextViewService, onFocus: (name) => void): void {
	let possibleInputs: string[] = [];
	let optionValue = this.getOptionValueAndCategoryValues(option, options, possibleInputs);
	let optionWidget: any;
	let inputElement: HTMLElement;
	let missingErrorMessage = localize('missingRequireField', ' is required.');
	let invalidInputMessage = localize('invalidInput', 'Invalid input.  Numeric value expected.');
	switch (option.valueType) {
		case ServiceOptionType.number:
			optionWidget = new DialogInputBox(rowContainer.getHTMLElement(), contextViewService, {
				validationOptions: {
					validation: (value: string) => {
						if (!value && option.isRequired) {
							return { type: MessageType.ERROR, content: option.displayName + missingErrorMessage };
						} else if (!types.isNumber(Number(value))) {
							return { type: MessageType.ERROR, content: invalidInputMessage };
						} else {
							return null;
						}
					}
				}
			});
			optionWidget.value = optionValue;
			inputElement = this.findElement(rowContainer, 'input');
			break;
		case ServiceOptionType.category:
		case ServiceOptionType.boolean:
			optionWidget = new DialogSelectBox(possibleInputs, optionValue.toString());
			DialogHelper.appendInputSelectBox(rowContainer, optionWidget);
			inputElement = this.findElement(rowContainer, 'select-box');
			break;
		case ServiceOptionType.string:
		case ServiceOptionType.password:
			optionWidget = new DialogInputBox(rowContainer.getHTMLElement(), contextViewService, {
				validationOptions: {
					validation: (value: string) => (!value && option.isRequired) ? ({ type: MessageType.ERROR, content: option.displayName + missingErrorMessage }) : null
				}
			});
			optionWidget.value = optionValue;
			if (option.valueType === ServiceOptionType.password) {
				optionWidget.inputElement.type = 'password';
			}
			inputElement = this.findElement(rowContainer, 'input');
	}
	optionsMap[option.name] = { optionWidget: optionWidget, option: option, optionValue: optionValue };
	inputElement.onfocus = () => onFocus(option.name);
}

export function getOptionValueAndCategoryValues(option: data.ServiceOption, options: { [optionName: string]: any }, possibleInputs: string[]): any {
	var optionValue = option.defaultValue;
	if (options[option.name]) {
		// if the value type is boolean, the option value can be either boolean or string
		if (option.valueType === ServiceOptionType.boolean) {
			if (options[option.name] === true || options[option.name] === this.trueInputValue) {
				optionValue = this.trueInputValue;
			} else {
				optionValue = this.falseInputValue;
			}
		} else {
			optionValue = options[option.name];
		}
	}

	if (option.valueType === ServiceOptionType.boolean || option.valueType === ServiceOptionType.category) {
		// If the option is not required, the empty string should be add at the top of possible choices
		if (!option.isRequired) {
			possibleInputs.push('');
		}

		if (option.valueType === ServiceOptionType.boolean) {
			possibleInputs.push(this.trueInputValue, this.falseInputValue);
		} else {
			option.categoryValues.map(c => possibleInputs.push(c.name));
		}

		// If the option value is not set and default value is null, the option value should be set to the first possible input.
		if (optionValue === null || optionValue === undefined) {
			optionValue = possibleInputs[0];
		}
	}
	return optionValue;
}

export function validateInputs(optionsMap: { [optionName: string]: IOptionElement }): boolean {
	let isValid = true;
	let isFocused = false;
	for (var optionName in optionsMap) {
		var optionElement: IOptionElement = optionsMap[optionName];
		var widget = optionElement.optionWidget;
		var isInputBox = (optionElement.option.valueType === ServiceOptionType.string ||
			optionElement.option.valueType === ServiceOptionType.password ||
			optionElement.option.valueType === ServiceOptionType.number);

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

export function updateOptions(options: { [optionName: string]: any }, optionsMap: { [optionName: string]: IOptionElement }): void {
	for (var optionName in optionsMap) {
		var optionElement: IOptionElement = optionsMap[optionName];
		if (optionElement.optionWidget.value !== optionElement.optionValue) {
			if (!optionElement.optionWidget.value && options[optionName]) {
				delete options[optionName];
			}
			if (optionElement.optionWidget.value) {
				if (optionElement.option.valueType === ServiceOptionType.boolean) {
					options[optionName] = (optionElement.optionWidget.value === this.trueInputValue) ? true : false;
				} else {
					options[optionName] = optionElement.optionWidget.value;
				}
			}
		}
	}
}

export let trueInputValue: string = 'True';
export let falseInputValue: string = 'False';

export function findElement(container: Builder, className: string): HTMLElement {
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

export function groupOptionsByCategory(options: data.ServiceOption[]): { [category: string]: data.ServiceOption[] } {
	var connectionOptionsMap: { [category: string]: data.ServiceOption[] } = {};
	options.forEach(option => {
		var groupName = option.groupName;
		if (groupName === null || groupName === undefined) {
			groupName = 'General';
		}

		if (!!connectionOptionsMap[groupName]) {
			connectionOptionsMap[groupName].push(option);
		} else {
			connectionOptionsMap[groupName] = [option];
		}
	});
	return connectionOptionsMap;
}