/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Builder, $ } from 'vs/base/browser/builder';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';

export class ConnectionDialogHelper {
	static appendRow(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
		let cellContainer: Builder;
		container.element('tr', {}, (rowContainer) => {
				rowContainer.element('td', {class: labelClass}, (labelCellContainer) => {
						labelCellContainer.div({}, (labelContainer) => {
								labelContainer.innerHtml(label);
						});
				});
				rowContainer.element('td', {class: cellContainerClass}, (inputCellContainer) => {
					cellContainer = inputCellContainer;
				});
		});

		return cellContainer;
	}

	static appendInputBox(container: Builder): InputBox {
		return new InputBox(container.getHTMLElement(), null, {});
	}

	static appendInputSelectBox(container: Builder, selectBox: ConnectionDialogSelectBox): ConnectionDialogSelectBox {
		selectBox.render(container.getHTMLElement());
		return selectBox;
	}

	static isNumeric(num): boolean	{
   		return !isNaN(num)
	}
}