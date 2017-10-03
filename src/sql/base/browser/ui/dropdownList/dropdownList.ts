/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/base/browser/ui/dropdownList/media/dropdownList';
import * as DOM from 'vs/base/browser/dom';
import { Dropdown, IDropdownOptions } from 'vs/base/browser/ui/dropdown/dropdown';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Color } from 'vs/base/common/color';
import { IAction } from 'vs/base/common/actions';
import { Button } from 'vs/base/browser/ui/button/button';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';
import { EventType as GestureEventType } from 'vs/base/browser/touch';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';

export interface IDropdownStyles {
	backgroundColor?: Color;
	foregroundColor?: Color;
	borderColor?: Color;
}

export class DropdownList extends Dropdown {

	protected backgroundColor: Color;
	protected foregroundColor: Color;
	protected borderColor: Color;

	constructor(
		container: HTMLElement,
		private _options: IDropdownOptions,
		private _contentContainer: HTMLElement,
		private _list: List<any>,
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

		this.element.on([DOM.EventType.CLICK, DOM.EventType.MOUSE_DOWN, GestureEventType.Tap], (e: Event) => {
			DOM.EventHelper.stop(e, true); // prevent default click behaviour to trigger
		}).on([DOM.EventType.MOUSE_DOWN, GestureEventType.Tap], (e: Event) => {
			// We want to show the context menu on dropdown so that as a user you can press and hold the
			// mouse button, make a choice of action in the menu and release the mouse to trigger that
			// action.
			// Due to some weird bugs though, we delay showing the menu to unwind event stack
			// (see https://github.com/Microsoft/vscode/issues/27648)
			setTimeout(() => this.show(), 100);
		}).on([DOM.EventType.KEY_DOWN], (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				setTimeout(() => this.show(), 100);
			} else if (event.equals(KeyCode.DownArrow)) {
				this._list.getHTMLElement().focus();
			}
		});

		this.toDispose.push(this._list.onSelectionChange(() => {
			this.element.getHTMLElement().focus();
			this.hide();
		}));

		this.element.getHTMLElement().setAttribute('tabindex', '0');
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
		if (!DOM.isAncestor(<HTMLElement>e.target, this.element.getHTMLElement()) && !DOM.isAncestor(<HTMLElement>e.target, this._list.getHTMLElement())) {
			this.hide();
		}
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