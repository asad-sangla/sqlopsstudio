/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { SelectBox as vsSelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { Color } from 'vs/base/common/color';
import { ISelectBoxStyles } from 'vs/base/browser/ui/selectBox/selectBox';

export class SelectBox extends vsSelectBox {
	private _optionsDictionary;
	private _dialogOptions: string[];
	private _selectedOption: string;
	private _toDispose2: lifecycle.IDisposable[];
	private enabledSelectBackground: Color;
	private enabledSelectForeground: Color;
	private enabledSelectBorder: Color;
	private disabledSelectBackground: Color;
	private disabledSelectForeground: Color;
	private disabledSelectBorder: Color;

	constructor(options: string[], selectedOption: string) {
		super(options, 0);
		this._optionsDictionary = new Array();
		for (var i = 0; i < options.length; i++) {
			this._optionsDictionary[options[i]] = i;
		}
		super.select(this._optionsDictionary[selectedOption]);
		this._selectedOption = selectedOption;
		this._dialogOptions = options;
		this._toDispose2 = [];
		this._toDispose2.push(this.onDidSelect(newInput => {
			this._selectedOption = newInput.selected;
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

	public selectWithOptionName(optionName: string): void {
		if (this._optionsDictionary[optionName] !== null || this._optionsDictionary[optionName] !== undefined) {
			this.select(this._optionsDictionary[optionName]);
		}
	}

	public select(index: number): void {
		super.select(index);
		if (this._dialogOptions !== undefined) {
			this._selectedOption = this._dialogOptions[index];
		}
	}

	public setOptions(options: string[], selected?: number, disabled?: number): void {
		this._optionsDictionary = [];
		for (var i = 0; i < options.length; i++) {
			this._optionsDictionary[options[i]] = i;
		}
		this._dialogOptions = options;
		super.setOptions(options, selected, disabled);
	}

	public get value(): string {
		return this._selectedOption;
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