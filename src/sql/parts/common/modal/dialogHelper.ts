/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Builder } from 'vs/base/browser/builder';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';

export function appendRow(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
	let cellContainer: Builder;
	container.element('tr', {}, (rowContainer) => {
		rowContainer.element('td', { class: labelClass }, (labelCellContainer) => {
			labelCellContainer.div({}, (labelContainer) => {
				labelContainer.innerHtml(label);
			});
		});
		rowContainer.element('td', { class: cellContainerClass }, (inputCellContainer) => {
			cellContainer = inputCellContainer;
		});
	});

	return cellContainer;
}

export function appendRowLink(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
	let rowButton: Button;
	container.element('tr', {}, (rowContainer) => {
		rowContainer.element('td', { class: labelClass }, (labelCellContainer) => {
			labelCellContainer.div({}, (labelContainer) => {
				labelContainer.innerHtml(label);
			});
		});
		rowContainer.element('td', { class: cellContainerClass }, (inputCellContainer) => {
			inputCellContainer.element('div', {}, (rowContainer) => {
				rowButton = new Button(rowContainer);

			});
		});
	});

	return new Builder(rowButton.getElement());
}

export function createCheckBox(container: Builder, label: string, checkboxClass: string, isChecked: boolean, onCheck?: (viaKeyboard: boolean) => void): Checkbox {
	let checkbox = new Checkbox({
		actionClassName: checkboxClass,
		title: label,
		isChecked: isChecked,
		onChange: (viaKeyboard) => {
			if (onCheck) {
				onCheck(viaKeyboard);
			}
		}
	});
	container.getHTMLElement().appendChild(checkbox.domNode);
	container.div({}, (labelContainer) => {
		labelContainer.innerHtml(label);
	});

	return checkbox;
}

export function appendInputSelectBox(container: Builder, selectBox: DialogSelectBox): DialogSelectBox {
	selectBox.render(container.getHTMLElement());
	return selectBox;
}

export function isNumeric(num): boolean {
	return !isNaN(num);
}

export function isEmptyString(value: string): boolean {
	//TODO find a better way to check for empty string
	return value === undefined || value === '';
}

export function isNullOrWhiteSpace(value: string): boolean {
	// returns true if the string is null or contains white space/tab chars only
	return !value || value.trim().length === 0;
}