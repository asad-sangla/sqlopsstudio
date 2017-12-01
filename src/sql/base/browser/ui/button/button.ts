/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { Button as vsButton, IButtonOptions, IButtonStyles as vsIButtonStyles } from 'vs/base/browser/ui/button/button';
import * as DOM from 'vs/base/browser/dom';
import { Color } from 'vs/base/common/color';

export interface IButtonStyles extends vsIButtonStyles {
	buttonFocusOutline?: Color;
}

export class Button extends vsButton {
	private buttonFocusOutline: Color;

	constructor(container: any, options?: IButtonOptions) {
		super(container, options);
		this.buttonFocusOutline = null;

		this.$el.on(DOM.EventType.FOCUS, (e) => {
			this.$el.style('outline-color', this.buttonFocusOutline ? this.buttonFocusOutline.toString() : null);
			this.$el.style('outline-width', '1px');
		});
	}

	public style(styles: IButtonStyles): void {
		super.style(styles);
		this.buttonFocusOutline = styles.buttonFocusOutline;
	}

	public set title(value: string) {
		this.$el.title(value);
	}
}