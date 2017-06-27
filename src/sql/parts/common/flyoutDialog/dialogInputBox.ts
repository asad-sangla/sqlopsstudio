/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { InputBox, IInputOptions, IInputBoxStyles } from 'vs/base/browser/ui/inputbox/inputBox';
import { IContextViewProvider } from 'vs/base/browser/ui/contextview/contextview';
import { Color } from 'vs/base/common/color';

export class DialogInputBox extends InputBox {
	private enabledInputBackground: Color;
	private enabledInputForeground: Color;
	private enabledInputBorder: Color;
	private disabledInputBackground: Color;
	private disabledInputForeground: Color;
	private disabledInputBorder: Color;

	constructor(container: HTMLElement, contextViewProvider: IContextViewProvider, options?: IInputOptions) {
		super(container, contextViewProvider, options);
		this.enabledInputBackground = this.inputBackground;
		this.enabledInputForeground = this.inputForeground;
		this.enabledInputBorder = this.inputBorder;
		this.disabledInputBackground = Color.transparent;
		this.disabledInputForeground = null;
		this.disabledInputBorder = null;
	}

	public style(styles: IInputBoxStyles): void {
		super.style(styles);
		this.enabledInputBackground = this.inputBackground;
		this.enabledInputForeground = this.inputForeground;
		this.enabledInputBorder = this.inputBorder;
	}

	public enable(): void {
		super.enable();
		this.inputBackground = this.enabledInputBackground;
		this.inputForeground = this.enabledInputForeground;
		this.inputBorder = this.enabledInputBorder;
		this.applyStyles();
	}

	public disable(): void {
		super.disable();
		this.inputBackground = this.disabledInputBackground;
		this.inputForeground = this.disabledInputForeground;
		this.inputBorder = this.disabledInputBorder;
		this.applyStyles();
	}
}