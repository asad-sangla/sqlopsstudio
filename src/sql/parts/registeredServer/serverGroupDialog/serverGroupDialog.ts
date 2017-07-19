/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/serverGroupDialog';
import { Builder } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { Modal } from 'sql/parts/common/modal/modal';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import * as lifecycle from 'vs/base/common/lifecycle';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler, attachButtonStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';

export interface IColorCheckboxInfo {
	checkbox: Checkbox;
	color: string;
}

export class ServerGroupDialog extends Modal {
	private _bodyBuilder: Builder;
	private _addServerButton: Button;
	private _closeButton: Button;
	private _colorCheckBoxesMap: { [colorOption: number]: IColorCheckboxInfo } = {};
	private _selectedColorOption: number;
	private _groupNameInputBox: DialogInputBox;
	private _groupDescriptionInputBox: DialogInputBox;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _defaultColor: number = 1;
	private _colors: string[] = ['#515151', '#004760', '#771b00', '#700060', '#a17d01', '#006749', '#654502', '#3A0293'];
	private readonly _addServerGroupTitle = localize('addServerGroup', 'Add server group');
	private readonly _editServerGroupTitle = localize('editServerGroup', 'Edit server group');


	private _onAddServerGroup = new Emitter<void>();
	public onAddServerGroup: Event<void> = this._onAddServerGroup.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	private _onCloseEvent = new Emitter<void>();
	public onCloseEvent: Event<void> = this._onCloseEvent.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super('Server Groups', partService);
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		let okLabel = localize('ok', 'OK');
		let cancelLabel = localize('cancel', 'Cancel');
		this._addServerButton = this.addFooterButton(okLabel, () => this.addGroup());
		this._closeButton = this.addFooterButton(cancelLabel, () => this.cancel());
		this.registerListeners();
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ class: 'server-group-dialog' }, (builder) => {
			this._bodyBuilder = builder;
		});
		// Connection Group Name
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			let connectionGroupNameLabel = localize('connectionGroupName', 'Connection group name');
			labelContainer.innerHtml(connectionGroupNameLabel);
		});
		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			let errorMessage = localize('MissingGroupNameError', 'Group name is required.');
			this._groupNameInputBox = new DialogInputBox(inputCellContainer.getHTMLElement(), this._contextViewService, {
				validationOptions: {
					validation: (value: string) => DialogHelper.isEmptyString(value) ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			});
		});

		// Connection Group Description
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			let groupDescriptionLabel = localize('groupDescription', 'Group description');
			labelContainer.innerHtml(groupDescriptionLabel);
		});
		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			this._groupDescriptionInputBox = new DialogInputBox(inputCellContainer.getHTMLElement(), this._contextViewService);
		});

		// Connection Group Color
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			let groupColorLabel = localize('groupColor', 'Group color');
			labelContainer.innerHtml(groupColorLabel);
		});

		this._bodyBuilder.div({ class: 'group-color-options' }, (groupColorContainer) => {
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

		this._bodyBuilder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyMod.Shift | KeyCode.Tab)) {
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
		if (DialogHelper.isEmptyString(this._groupNameInputBox.value)) {
			this._addServerButton.enabled = false;
		} else {
			this._addServerButton.enabled = true;
		}
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
		if (this._addServerButton.enabled) {
			if (this.validateInputs()) {
				this._onAddServerGroup.fire();
			}
		}
	}

	public hideError() {
		this.setError('');
	}

	private validateInputs(): boolean {
		let validate = this._groupNameInputBox.validate();
		if (!validate) {
			this._groupNameInputBox.focus();
		}
		return validate;
	}

	/* Overwrite esapce key behavior */
	protected onClose() {
		this.cancel();
	}

	/* Overwrite enter key behavior */
	protected onAccept() {
		this.addGroup();
	}

	public cancel() {
		this._onCancel.fire();
		this.close();
	}

	public close() {
		this.hide();
		this._onCloseEvent.fire();
	}

	public open(editGroup: boolean, group?: ConnectionProfileGroup) {
		// reset the dialog
		this.hideError();
		this._groupNameInputBox.value = '';
		this._groupNameInputBox.hideMessage();
		this._groupDescriptionInputBox.value = '';
		this.onSelectGroupColor(this._defaultColor);

		if (editGroup && group) {
			this.title = this._editServerGroupTitle;
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
			this.title = this._addServerGroupTitle;
		}

		this.show();
		this._groupNameInputBox.focus();
		this._addServerButton.enabled = false;
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}