/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import 'vs/css!./quickopen';
import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import browser = require('vs/base/browser/browser');
import { Dimension, Builder, $ } from 'vs/base/browser/builder';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { Button } from 'vs/base/browser/ui/button/button';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import DOM = require('vs/base/browser/dom');
import { KeyCode } from 'vs/base/common/keyCodes';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import vscode = require('vscode');

export interface IConnectionDialogCallbacks {
	onOk: () => void;
	onCancel: () => void;
	onType: (value: string) => void;
	onShow?: () => void;
	onHide?: (reason: HideReason) => void;
	onFocusLost?: () => boolean /* veto close */;
}

export enum HideReason {
	OK,
	FOCUS_LOST,
	CANCELED
}

const DEFAULT_INPUT_ARIA_LABEL = nls.localize('quickOpenAriaLabel', "Quick picker. Type to narrow down results.");

export class ConnectionDialogWidget {

	private serverName: InputBox;
	private databaseName: InputBox;
	private userName: InputBox;
	private password: InputBox;
	private connectionButton: Button;

	private builder: Builder;
	private inputContainer: Builder;
	private visible: boolean;
	private isLoosingFocus: boolean;
	private callbacks: IConnectionDialogCallbacks;
	private toUnbind: IDisposable[];
	private container: HTMLElement;
	private layoutDimensions: Dimension;

	constructor(container: HTMLElement, callbacks: IConnectionDialogCallbacks) {
		this.toUnbind = [];
		this.container = container;
		this.callbacks = callbacks;
	}

	public getElement(): Builder {
		return $(this.builder);
	}

	public setCallbacks(callbacks: IConnectionDialogCallbacks): void {
		this.callbacks = callbacks;
	}

	public create(): HTMLElement {
		this.builder = $().div((div: Builder) => {

			div.div({ 'class': 'quick-open-input' }, (inputContainer) => {
				this.inputContainer = inputContainer;

				this.serverName = new InputBox(inputContainer.getHTMLElement(), null, {
					placeholder: 'Server Name',
					ariaLabel: DEFAULT_INPUT_ARIA_LABEL
				});

				this.databaseName = new InputBox(inputContainer.getHTMLElement(), null, {
					placeholder: 'Database Name',
					ariaLabel: DEFAULT_INPUT_ARIA_LABEL
				});

				this.userName = new InputBox(inputContainer.getHTMLElement(), null, {
					placeholder: 'User Name',
					ariaLabel: DEFAULT_INPUT_ARIA_LABEL
				});

				this.password = new InputBox(inputContainer.getHTMLElement(), null, {
					placeholder: 'Password',
					ariaLabel: DEFAULT_INPUT_ARIA_LABEL,
					type: 'password'
				});

				this.connectionButton = new Button(inputContainer.getHTMLElement());
				this.connectionButton.label = 'Connect';
				this.connectionButton.addListener2('click', () => {
					this.hide(HideReason.OK);
				});
			});

			div.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
				const keyboardEvent: StandardKeyboardEvent = new StandardKeyboardEvent(e);
				if (keyboardEvent.keyCode === KeyCode.Escape) {
					DOM.EventHelper.stop(e, true);

					this.hide(HideReason.CANCELED);
				}
			})
				.on(DOM.EventType.FOCUS, (e: Event) => this.gainingFocus(), null, true)
				.on(DOM.EventType.BLUR, (e: Event) => this.loosingFocus(e), null, true);
		})
			// Widget Attributes
			.addClass('quick-open-widget')
			.addClass((browser.isIE10orEarlier) ? ' no-shadow' : '')
			.build(this.container);

		// Support layout
		if (this.layoutDimensions) {
			this.layout(this.layoutDimensions);
		}

		this.visible = true;

		return this.builder.getHTMLElement();
	}

	public show(): void {
		this.visible = true;
		this.isLoosingFocus = false;

		this.inputContainer.show();
		this.builder.show();
		this.serverName.focus();

		if (this.callbacks.onShow) {
			this.callbacks.onShow();
		}
	}

	public hide(reason?: HideReason): void {
		if (!this.isVisible()) {
			return;
		}

		this.visible = false;
		this.builder.hide();
		this.builder.domBlur();

		// Clear input field and clear tree
		// this.serverName.value = '';
		// this.databaseName.value = '';
		// this.userName.value = '';
		// this.password.value = '';

		if (this.serverName.hasFocus()) {
			this.serverName.blur();
		}

		// Callbacks
		if (reason === HideReason.OK) {
			this.callbacks.onOk();
		} else {
			this.callbacks.onCancel();
		}

		if (this.callbacks.onHide) {
			this.callbacks.onHide(reason);
		}
	}

	public getConnection(): vscode.ConnectionInfo {
		this.serverName.validate();

		return {
			serverName: this.serverName.value,
			databaseName: this.databaseName.value,
			userName: this.userName.value,
			password: this.password.value
		};
	}

	public isVisible(): boolean {
		return this.visible;
	}

	public layout(dimension: Dimension): void {
		this.layoutDimensions = dimension;

		const quickOpenWidth = Math.min(this.layoutDimensions.width * 0.9);
		if (this.builder) {

			// quick open
			this.builder.style({
				width: quickOpenWidth + 'px',
				marginLeft: '-' + (quickOpenWidth / 2) + 'px'
			});

			// input field
			this.inputContainer.style({
				width: (quickOpenWidth - 12) + 'px'
			});
		}
	}

	private gainingFocus(): void {
		this.isLoosingFocus = false;
	}

	private loosingFocus(e: Event): void {
		if (!this.isVisible()) {
			return;
		}

		const relatedTarget = (<any>e).relatedTarget;
		if (DOM.isAncestor(relatedTarget, this.builder.getHTMLElement())) {
			return; // user clicked somewhere into connection dialog, do not close thereby
		}

		this.isLoosingFocus = true;
		TPromise.timeout(0).then(() => {
			if (!this.isLoosingFocus) {
				return;
			}

			const veto = this.callbacks.onFocusLost && this.callbacks.onFocusLost();
			if (!veto) {
				this.hide(HideReason.FOCUS_LOST);
			}
		});
	}

	public dispose(): void {
		this.toUnbind = dispose(this.toUnbind);

		this.serverName.dispose();
		this.databaseName.dispose();
		this.userName.dispose();
		this.password.dispose();
	}
}
