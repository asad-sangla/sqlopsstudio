/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Builder } from 'vs/base/browser/builder';
import { IInputOptions } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import { Button } from 'vs/base/browser/ui/button/button';
import { IContextViewProvider } from 'vs/base/browser/ui/contextview/contextview';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';

export class DialogHelper {
	static appendRow(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
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

	static appendRowLink(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
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

	static createCheckBox(container: Builder, label: string, checkboxClass: string, isChecked: boolean, onCheck?: (viaKeyboard: boolean) => void): Checkbox {
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

	static appendInputBox(container: Builder, options?: IInputOptions, contextViewProvider?: IContextViewProvider): DialogInputBox {
		return new DialogInputBox(container.getHTMLElement(), contextViewProvider, options);
	}

	static appendInputSelectBox(container: Builder, selectBox: DialogSelectBox): DialogSelectBox {
		selectBox.render(container.getHTMLElement());
		return selectBox;
	}

	static isNumeric(num): boolean {
		return !isNaN(num);
	}

	static isEmptyString(value: string): boolean {
		//TODO find a better way to check for empty string
		return value === undefined || value === '';
	}
}