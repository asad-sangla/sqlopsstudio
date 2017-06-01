/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import * as lifecycle from 'vs/base/common/lifecycle';

export class DialogSelectBox extends SelectBox {
	private _optionsDictionary;
	private _dialogOptions: string[];
	private _selectedOption: string;
	private _toDispose2: lifecycle.IDisposable[];

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
			this._selectedOption = newInput;
		}));
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
}