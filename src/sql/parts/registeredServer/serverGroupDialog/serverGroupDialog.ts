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
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import { DialogHelper } from 'sql/parts/common/flyoutDialog/dialogHelper';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogInputBox } from 'sql/parts/common/flyoutDialog/dialogInputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler, attachButtonStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';

export interface IServerGroupCallbacks {
	onAddServerGroup: () => void;
	onCancel: () => void;
	onClose: () => void;
}

export interface IColorCheckboxInfo {
	checkbox: Checkbox;
	color: string;
}

export class ServerGroupDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _callbacks: IServerGroupCallbacks;
	private _addServerButton: Button;
	private _closeButton: Button;
	private _dialog: ModalDialogBuilder;
	private _colorCheckBoxesMap: { [colorOption: number]: IColorCheckboxInfo };
	private _selectedColorOption: number;
	private _groupNameInputBox: DialogInputBox;
	private _groupDescriptionInputBox: DialogInputBox;
	private _toDispose: lifecycle.IDisposable[];
	private _defaultColor: number;
	private _colors: string[];
	private readonly _addServerGroupTitle = 'Add Server Group';
	private readonly _editServerGroupTitle = 'Edit Server Group';

	constructor(container: HTMLElement,
		callbacks: IServerGroupCallbacks,
		@IThemeService private _themeService: IThemeService) {
		this._container = container;
		this._callbacks = callbacks;
		this._colorCheckBoxesMap = {};
		this._toDispose = [];
		this._defaultColor = 1;
		this._colors = ['#515151', '#004760', '#771b00', '#700060', '#a17d01', '#006749', '#654502', '#3A0293'];
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder(this._addServerGroupTitle, 'server-group-dialog', 'serverGroupDialogBody');
		this._builder = this._dialog.create(true);
		attachModalDialogStyler(this._dialog, this._themeService);
		this._dialog.addModalTitle();

		this._dialog.bodyContainer.div({ class: 'modal-body-content' }, (addServerGroupContent) => {
			// Connection Group Name
			addServerGroupContent.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml('Connection Group Name');
			});
			addServerGroupContent.div({ class: 'input-divider' }, (inputCellContainer) => {
				this._groupNameInputBox = DialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Description
			addServerGroupContent.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Description');
			});
			addServerGroupContent.div({ class: 'input-divider' }, (inputCellContainer) => {
				this._groupDescriptionInputBox = DialogHelper.appendInputBox(inputCellContainer);
			});

			// Connection Group Color
			addServerGroupContent.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml('Group Color');
			});

			addServerGroupContent.div({ class: 'Group-color-options' }, (groupColorContainer) => {
				for (let i = 0; i < this._colors.length; i++) {
					let color = this._colors[i];

					let colorCheckBox = new Checkbox({
						actionClassName: 'server-group-color',
						title: color,
						isChecked: false,
						onChange: (viaKeyboard) => {
							this.onSelectGroupColor(i + 1);
						}
					});
					colorCheckBox.domNode.style.backgroundColor = color;
					groupColorContainer.getHTMLElement().appendChild(colorCheckBox.domNode);

					// Theme styler
					this._toDispose.push(attachCheckboxStyler(colorCheckBox, this._themeService));

					this._colorCheckBoxesMap[i + 1] = { checkbox: colorCheckBox, color: color };
				}
			});
		});
		this._dialog.addErrorMessage();
		this._addServerButton = this.createFooterButton(this._dialog.footerContainer, 'OK');
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this.onSelectGroupColor(this._defaultColor);

		this._builder.build(this._container);
		jQuery(this._builder.getHTMLElement()).modal({ backdrop: false, keyboard: false });
		this._builder.hide();

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
			this._colorCheckBoxesMap[this._selectedColorOption].checkbox.focus();
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
			this._colorCheckBoxesMap[this._selectedColorOption].checkbox.focus();
		} else if (this.getIndexOfFocusedColor()) {
			this._groupDescriptionInputBox.focus();
		} else if (this._groupDescriptionInputBox.hasFocus()) {
			this._groupNameInputBox.focus();
		}
	}

	private getIndexOfFocusedColor(): number {
		let index: number;
		for (let i = 1; i <= this._colors.length; i++) {
			let checkbox = this._colorCheckBoxesMap[i].checkbox;
			if (document.activeElement === checkbox.domNode) {
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
				this._colorCheckBoxesMap[index].checkbox.focus();
			}
		}
	}

	private onSelectGroupColor(colorOption: number): void {
		if (this._selectedColorOption !== colorOption) {
			if (this._selectedColorOption) {
				var recentSelectedCheckbox = this._colorCheckBoxesMap[this._selectedColorOption].checkbox;
				recentSelectedCheckbox.checked = false;
			}

			this._selectedColorOption = colorOption;
		}
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.div({ class: 'footer-button' }, (buttonContainer) => {
			button = new Button(buttonContainer);
			button.label = title;
			button.addListener('click', () => {
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
		// Theme styler
		this._toDispose.push(attachInputBoxStyler(this._groupNameInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._groupDescriptionInputBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._addServerButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));

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
		return this._colorCheckBoxesMap[this._selectedColorOption].color;
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
		this._builder.hide();
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
			for (var key in this._colorCheckBoxesMap) {
				if (this._colorCheckBoxesMap[key].color === group.color) {
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

		this._builder.show();
		this._groupNameInputBox.focus();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}