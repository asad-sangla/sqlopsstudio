/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as WorkbenchUtils from 'sql/workbench/common/sqlWorkbenchUtils';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { Color } from 'vs/base/common/color';
import { ISelectBoxStyles } from 'vs/base/browser/ui/selectBox/selectBox';
import * as dom from 'vs/base/browser/dom';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';

/*
*  Extends SelectBox to allow multiple selection and adding/remove items dynamically
*/
export class ListBox extends SelectBox {
	private _toDispose2: lifecycle.IDisposable[];
	private enabledSelectBackground: Color;
	private enabledSelectForeground: Color;
	private enabledSelectBorder: Color;
	private disabledSelectBackground: Color;
	private disabledSelectForeground: Color;
	private disabledSelectBorder: Color;
	private keyC = 33;

	constructor(options: string[], selectedOption: string) {
		super(options, 0);
		this.selectElement.multiple = true;
		this.selectElement.style['height'] = '80px';

		// Set width style for horizontal scrollbar
		this.selectElement.style['width'] = 'inherit';
		this.selectElement.style['min-width'] = '100%';

		this._toDispose2 = [];
		this._toDispose2.push(dom.addStandardDisposableListener(this.selectElement, 'keydown', (e) => {
			this.onKeyDown(e)
		}));

		this.enabledSelectBackground = this.selectBackground;
		this.enabledSelectForeground = this.selectForeground;
		this.enabledSelectBorder = this.selectBorder;
		this.disabledSelectBackground = Color.transparent;
		this.disabledSelectForeground = null;
		this.disabledSelectBorder = null;
	}

	public style(styles: ISelectBoxStyles): void {
		super.style(styles);
		this.enabledSelectBackground = this.selectBackground;
		this.enabledSelectForeground = this.selectForeground;
		this.enabledSelectBorder = this.selectBorder;
	}

	public get selectedOptions(): string[] {
		var selected = [];
		for (var i = 0; i < this.selectElement.selectedOptions.length; i++ ) {
			selected.push(this.selectElement.selectedOptions[i].innerHTML);
		}
		return selected;
	}

	// Remove selected options
	public remove(): void {
		var indexes = [];
		for (var i = 0; i < this.selectElement.selectedOptions.length; i++ ) {
			indexes.push(this.selectElement.selectedOptions[i].index);
		}
		indexes.sort((a, b) => b-a);

		for (var i = 0; i < indexes.length; i++) {
			this.selectElement.remove(i);
			this.options.splice(i, 1);
		}
	}

	public add(option: string): void {
		this.selectElement.add(this.createOption(option));
	}

	// Allow copy to clipboard
	public onKeyDown(event: IKeyboardEvent): void {
		if (this.selectedOptions.length > 0)
        {
            var key = event.keyCode;
            var ctrlOrCmd = event.ctrlKey || event.metaKey;

            if (ctrlOrCmd && key === this.keyC) {
                var textToCopy =  this.selectedOptions[0];
                for (var i = 1; i < this.selectedOptions.length; i++) {
                    textToCopy = textToCopy + ', ' + this.selectedOptions[i];
                }

                // Copy to clipboard
                WorkbenchUtils.executeCopy(textToCopy);
		        event.stopPropagation();
            }
        }
	}

	public dispose(): void {
		this._toDispose2 = lifecycle.dispose(this._toDispose2);
		super.dispose();
	}

	public enable(): void {
		this.selectElement.disabled = false;
		this.selectBackground = this.enabledSelectBackground;
		this.selectForeground = this.enabledSelectForeground;
		this.selectBorder = this.enabledSelectBorder;
		this.applyStyles();
	}

	public disable(): void {
		this.selectElement.disabled = true;
		this.selectBackground = this.disabledSelectBackground;
		this.selectForeground = this.disabledSelectForeground;
		this.selectBorder = this.disabledSelectBorder;
		this.applyStyles();
	}
}