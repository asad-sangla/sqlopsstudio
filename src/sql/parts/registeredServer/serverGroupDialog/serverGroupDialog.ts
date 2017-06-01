/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!sql/parts/common/flyoutDialog/media/flyoutDialog';
import 'vs/css!./media/serverGroupDialog';
import { Builder } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import { DialogHelper } from 'sql/parts/common/flyoutDialog/dialogHelper';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';

export interface IServerGroupCallbacks {
	onAddServerGroup: () => void;
	onCancel: () => void;
	onClose: () => void;
}

export interface IColorButtonInfo {
	button: Button;
	color: string;
}

export class ServerGroupDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _callbacks: IServerGroupCallbacks;
	private _addServerButton: Button;
	private _closeButton: Button;
	private _dialog: ModalDialogBuilder;
	private _colorButtonsMap: { [colorOption: number]: IColorButtonInfo };
	private _selectedColorOption: number;
	private _groupNameInputBox: InputBox;
	private _groupDescriptionInputBox: InputBox;
	private _toDispose: lifecycle.IDisposable[];
	private _defaultColor: number;
	private _colors: string[];
	private readonly _addServerGroupTitle = 'Add Server Group';
	private readonly _editServerGroupTitle = 'Edit Server Group';

	constructor(container: HTMLElement,
		callbacks: IServerGroupCallbacks) {
		this._container = container;
		this._callbacks = callbacks;
		this._colorButtonsMap = {};
		this._toDispose = [];
		this._defaultColor = 1;
		this._colors = ['#515151', '#004760', '#771b00', '#700060', '#a17d01', '#006749', '#654502', '#3A0293'];
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('serverGroupDialogModal', this._addServerGroupTitle, 'server-group-dialog', 'serverGroupDialogBody');
		this._builder = this._dialog.create(true);
		this._dialog.addModalTitle();

		this._dialog.bodyContainer.div({ class: 'add-server-group-body' }, (addServerGroupContent) => {
			// Connection Group Name
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Connection Group Name');
			});
			addServerGroupContent.div({ class: 'serverGroup-input' }, (inputCellContainer) => {
				this._groupNameInputBox = DialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Description
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Description');
			});
			addServerGroupContent.div({ class: 'serverGroup-input' }, (inputCellContainer) => {
				this._groupDescriptionInputBox = DialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Color
			addServerGroupContent.div({ class: 'serverGroup-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Color');
			});

			addServerGroupContent.div({ class: 'Group-color-options' }, (groupColorContainer) => {
				for (let i = 0; i < this._colors.length; i++) {
					let color = this._colors[i];
					let colorButton = new Button(groupColorContainer);
					colorButton.label = '';
					colorButton.getElement().style.background = color;
					colorButton.addListener2('click', () => {
						this.onSelectGroupColor(i + 1);
					});

					this._colorButtonsMap[i + 1] = { button: colorButton, color: color };
				}
			});
		});
		this._dialog.addErrorMessage();
		this._addServerButton = this.createFooterButton(this._dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this.onSelectGroupColor(this._defaultColor);

		this._builder.build(this._container);

		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				this.addGroup();
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			} else if (event.equals(KeyMod.Shift | KeyCode.Tab)) {
				this.preventDefaultKeyboardEvent(e);
				this.focusPrevious();
			} else if (event.equals(KeyCode.Tab)) {
				this.preventDefaultKeyboardEvent(e);
				this.focusNext();
			} else if (event.equals(KeyCode.RightArrow) || event.equals(KeyCode.LeftArrow)) {
				this.preventDefaultKeyboardEvent(e);
				this.focusNextColor(event.equals(KeyCode.RightArrow));
			}
		});

		this.registerListeners();
		return this._builder.getHTMLElement();
	}

	private preventDefaultKeyboardEvent(e: KeyboardEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	private focusNext(): void {
		if (this._groupNameInputBox.hasFocus()) {
			this._groupDescriptionInputBox.focus();
		} else if (this._groupDescriptionInputBox.hasFocus()) {
			this._colorButtonsMap[this._selectedColorOption].button.focus();
		} else if (this.getIndexOfFocusedColor()) {
			this._addServerButton.focus();
		} else if (document.activeElement === this._addServerButton.getElement()) {
			this._closeButton.focus();
		}
	}

	private focusPrevious(): void {
		if (document.activeElement === this._closeButton.getElement()) {
			this._addServerButton.focus();
		} else if (document.activeElement === this._addServerButton.getElement()) {
			this._colorButtonsMap[this._selectedColorOption].button.focus();
		} else if (this.getIndexOfFocusedColor()) {
			this._groupDescriptionInputBox.focus();
		} else if (this._groupDescriptionInputBox.hasFocus()) {
			this._groupNameInputBox.focus();
		}
	}

	private getIndexOfFocusedColor(): number {
		let index: number;
		for (let i = 1; i <= this._colors.length; i++) {
			let button = this._colorButtonsMap[i].button;
			if (document.activeElement === button.getElement()) {
				index = i;
			}
		}
		return index;
	}

	private focusNextColor(isNext: boolean): void {
		let index = this.getIndexOfFocusedColor();
		if (index) {
			if (isNext) {
				index++;
			} else {
				index--;
			}
			if ((index > 0) && (index <= this._colors.length)) {
				this._colorButtonsMap[index].button.focus();
			}
		}
	}

	private onSelectGroupColor(colorOption: number): void {
		if (this._selectedColorOption !== colorOption) {
			if (this._selectedColorOption) {
				var recentSelectedButton = this._colorButtonsMap[this._selectedColorOption].button;
				recentSelectedButton.getElement().classList.remove('selected');
			}

			var selectedColorButton = this._colorButtonsMap[colorOption].button;
			selectedColorButton.getElement().classList.add('selected');
			this._selectedColorOption = colorOption;
		}
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.div({ class: 'footer-button' }, (buttonContainer) => {
			button = new Button(buttonContainer);
			button.label = title;
			button.addListener2('click', () => {
				if (title === 'OK') {
					this.addGroup();
				} else {
					this.cancel();
				}
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
		return this._colorButtonsMap[this._selectedColorOption].color;
	}

	public addGroup(): void {
		if (this.validateInputs()) {
			this._callbacks.onAddServerGroup();
		}
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	private validateInputs(): boolean {
		if (DialogHelper.isEmptyString(this.groupName)) {
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
		this._callbacks.onClose();
	}

	public open(editGroup: boolean, group?: ConnectionProfileGroup) {
		// reset the dialog
		this.hideError();
		this._groupNameInputBox.hideMessage();
		this._groupNameInputBox.value = '';
		this._groupDescriptionInputBox.value = '';
		this.onSelectGroupColor(this._defaultColor);

		if (editGroup && group) {
			this._dialog.setDialogTitle(this._editServerGroupTitle);
			this._groupNameInputBox.value = group.name;
			this._groupDescriptionInputBox.value = group.description;
			let colorId: number;
			for (var key in this._colorButtonsMap) {
				if (this._colorButtonsMap[key].color === group.color) {
					colorId = Number(key);
					break;
				}
			}
			if (colorId) {
				this.onSelectGroupColor(colorId);
			}
		} else {
			this._dialog.setDialogTitle(this._addServerGroupTitle);
		}

		jQuery('#serverGroupDialogModal').modal({ backdrop: false, keyboard: true });
		this._groupNameInputBox.focus();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}