/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { InputBox, IInputOptions, IInputBoxStyles } from 'vs/base/browser/ui/inputbox/inputBox';
import { IContextViewProvider } from 'vs/base/browser/ui/contextview/contextview';
import { Color } from 'vs/base/common/color';
import Event, { Emitter } from 'vs/base/common/event';

export interface OnLoseFocusParams {
	value: string;
	hasChanged: boolean;
}

export class DialogInputBox extends InputBox {
	private enabledInputBackground: Color;
	private enabledInputForeground: Color;
	private enabledInputBorder: Color;
	private disabledInputBackground: Color;
	private disabledInputForeground: Color;
	private disabledInputBorder: Color;

	private _lastLoseFocusValue: string;

	private _onLoseFocus = this._register(new Emitter<OnLoseFocusParams>());
	public onLoseFocus: Event<OnLoseFocusParams> = this._onLoseFocus.event;


	constructor(container: HTMLElement, contextViewProvider: IContextViewProvider, options?: IInputOptions) {
		super(container, contextViewProvider, options);
		this.enabledInputBackground = this.inputBackground;
		this.enabledInputForeground = this.inputForeground;
		this.enabledInputBorder = this.inputBorder;
		this.disabledInputBackground = Color.transparent;
		this.disabledInputForeground = null;
		this.disabledInputBorder = null;

		this._lastLoseFocusValue = this.value;
		let self = this;
		this.onblur(this.inputElement, () => {
			self._onLoseFocus.fire({ value: self.value, hasChanged: self._lastLoseFocusValue !== self.value });
			self._lastLoseFocusValue = self.value;
		});
	}

	public style(styles: IInputBoxStyles): void {
		super.style(styles);
		this.enabledInputBackground = this.inputBackground;
		this.enabledInputForeground = this.inputForeground;
		this.enabledInputBorder = this.inputBorder;
	}

	public enable(): void {
		this.inputElement.readOnly = false;
		this.inputBackground = this.enabledInputBackground;
		this.inputForeground = this.enabledInputForeground;
		this.inputBorder = this.enabledInputBorder;
		this.applyStyles();
	}

	public disable(): void {
		this.inputElement.readOnly = true;
		this.inputBackground = this.disabledInputBackground;
		this.inputForeground = this.disabledInputForeground;
		this.inputBorder = this.disabledInputBorder;
		this.applyStyles();
	}
}