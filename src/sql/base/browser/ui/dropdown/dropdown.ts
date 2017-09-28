/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/base/browser/ui/dropdown/media/dropdown';
import * as DOM from 'vs/base/browser/dom';
import { Dropdown as vsDropdown, IDropdownOptions } from 'vs/base/browser/ui/dropdown/dropdown';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Color } from 'vs/base/common/color';
import { IAction } from 'vs/base/common/actions';
import { Button } from 'vs/base/browser/ui/button/button';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';

export interface IDropdownStyles {
	backgroundColor?: Color;
	foregroundColor?: Color;
	borderColor?: Color;
}

export class Dropdown extends vsDropdown {

	protected backgroundColor: Color;
	protected foregroundColor: Color;
	protected borderColor: Color;

	constructor(
		container: HTMLElement,
		private _options: IDropdownOptions,
		private _contentContainer: HTMLElement,
		private _themeService: IThemeService,
		private _action?: IAction,
	) {
		super(container, _options);
		if (_action) {
			let button = new Button(_contentContainer);
			button.label = _action.label;
			button.addListener('click', () => _action.run());
			attachButtonStyler(button, this._themeService);
		}
		DOM.append(this.element.getHTMLElement(), DOM.$('div.dropdown-icon'));
	}

	/**
	 * Render the dropdown contents
	 */
	protected renderContents(container: HTMLElement): IDisposable {
		let div = DOM.append(container, this._contentContainer);
		div.style.width = DOM.getTotalWidth(this.element.getHTMLElement()) + 'px';
		return null;
	}

	/**
	 * Render the selected label of the dropdown
	 */
	public renderLabel(): void {
		if (this._options.labelRenderer) {
			this._options.labelRenderer(this.label.getHTMLElement());
		}
	}

	protected onEvent(e: Event, activeElement: HTMLElement): void {
		if (!DOM.isAncestor(<HTMLElement>e.target, this.label.getHTMLElement())) {
			this.hide();
		}
	}

	public dispose(): void {
		super.dispose();
	}

	public style(styles: IDropdownStyles): void {
		this.backgroundColor = styles.backgroundColor;
		this.foregroundColor = styles.foregroundColor;
		this.borderColor = styles.borderColor;
		this.applyStyles();
	}

	protected applyStyles(): void {
		const background = this.backgroundColor ? this.backgroundColor.toString() : null;
		const foreground = this.foregroundColor ? this.foregroundColor.toString() : null;
		const border = this.borderColor ? this.borderColor.toString() : null;
		this.applyStylesOnElement(this._contentContainer, background, foreground, border);
		if (this.label) {
			this.applyStylesOnElement(this.element.getHTMLElement(), background, foreground, border);
		}
	}

	private applyStylesOnElement(element: HTMLElement, background: string, foreground: string, border: string): void {
		if (element) {
			element.style.backgroundColor = background;
			element.style.color = foreground;

			element.style.borderWidth = border ? '1px' : null;
			element.style.borderStyle = border ? 'solid' : null;
			element.style.borderColor = border;
		}
	}
}