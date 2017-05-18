/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/serverGroupDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';

export interface IServerGroupCallbacks {
	onAddServerGroup: () => void;
	onCancel: () => void;
}

export class ServerGroupDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _callbacks: IServerGroupCallbacks;
	private _addServerButton: Button;
	private _closeButton: Button;
	private _dialog: ModalDialogBuilder;
	private _colorButtonsMap: { [color: string]: Button };
	private _selectedColor: string;
	private _groupNameInputBox: InputBox;
	private _groupDescriptionInputBox: InputBox;
	private _toDispose: lifecycle.IDisposable[];
	private _defaultColor: string;

	constructor(container: HTMLElement,
		callbacks: IServerGroupCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._colorButtonsMap = {};
		this._toDispose = [];
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('serverGroupDialogModal', 'Create Server Group', 'server-group-dialog', 'serverGroupDialogBody');
		this._builder = this._dialog.create();
		this._dialog.addModalTitle();
		var colors= ['#162d9c', '#861b1b', '#611773', '#92941e', '#214c34', '#734a17', '#37327b', '#5e5e61'];
		this._defaultColor = colors[0];
		this._dialog.bodyContainer.div({ class: 'add-server-group-body' }, (addServerGroupContent) => {
			// Connection Group Name
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Connection Group Name');
			});
			addServerGroupContent.div({class: 'serverGroup-input'}, (inputCellContainer) => {
				this._groupNameInputBox = ConnectionDialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Description
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Description');
			});
			addServerGroupContent.div({class: 'serverGroup-input'}, (inputCellContainer) => {
				this._groupDescriptionInputBox = ConnectionDialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Color
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Color');
			});

			addServerGroupContent.div({ class: 'Group-color-options' }, (groupColorContainer) => {
				colors.forEach(color => {
					let colorButton = new Button(groupColorContainer);
					colorButton.label = '';
					colorButton.getElement().style.background = color;
					colorButton.addListener2('click', () => {
						this.onSelectGroupColor(color);
					});

					this._colorButtonsMap[color] = colorButton;
				});
			});
		});
		this._dialog.addErrorMessage();
		this._addServerButton = this.createFooterButton(this._dialog.footerContainer, 'Add Server Group');
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this._builder.build(this._container);

		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.addGroup();
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			}
		});

		this.registerListeners();
		return this._builder.getHTMLElement();
	}

	private onSelectGroupColor(color: string): void {
		if (this._selectedColor != color) {
			if (this._selectedColor) {
				var recentSelectedButton = this._colorButtonsMap[this._selectedColor];
				recentSelectedButton.getElement().classList.remove('selected');
			}

			var selectedColorButton = this._colorButtonsMap[color];
			selectedColorButton.getElement().classList.add('selected');
			this._selectedColor = color;
		}
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', (cellContainer) => {
			cellContainer.div({ class: 'footer-button' }, (buttonContainer) => {
				button = new Button(buttonContainer);
				button.label = title;
				button.addListener2('click', () => {
					if (title === 'Add Server Group') {
						this.addGroup();
					} else {
						this.cancel();
					}
				});
			});

		});

		return button;
	}

	private registerListeners(): void {
		this._toDispose.push(this._groupNameInputBox.onDidChange(groupName => {
			this.groupNameChanged(groupName);
		}));
	}

	private groupNameChanged(groupName: string) {
		this._groupNameInputBox.hideMessage();
	}


	public get groupName(): string {
		return this._groupNameInputBox.value;
	}

	public get groupDescription(): string {
		return this._groupDescriptionInputBox.value;
	}

	public get selectedColor(): string {
		return this._selectedColor;
	}

	public addGroup(): void {
		if (this.validateInputs()) {
			this._callbacks.onAddServerGroup();
			this.close();
		}
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	private validateInputs(): boolean {
		if (ConnectionDialogHelper.isEmptyString(this.groupName)) {
			var errorMsg = 'Group name is required.';
			this.showError(errorMsg);
			this._groupNameInputBox.showMessage({ type: MessageType.ERROR, content: errorMsg });
			return false;
		}
		return true;
	}

	public cancel() {
		this._callbacks.onCancel();
		this.close();
	}

	public close() {
		jQuery('#serverGroupDialogModal').modal('hide');
	}

	public open() {
		// reset the dialog
		this.hideError();
		this._groupNameInputBox.hideMessage();
		this._groupNameInputBox.value = '';
		this._groupDescriptionInputBox.value = '';
		this.onSelectGroupColor(this._defaultColor);

		jQuery('#serverGroupDialogModal').modal({ backdrop: false, keyboard: true });
		this._groupNameInputBox.focus();
	}

	public dispose(): void {
	}
}