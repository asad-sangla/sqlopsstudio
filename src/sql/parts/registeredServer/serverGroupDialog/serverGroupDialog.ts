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
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler, attachButtonStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';

import { Modal } from 'sql/parts/common/modal/modal';
import { InputBox } from 'sql/base/browser/ui/inputBox/inputBox';
import { ServerGroupViewModel } from 'sql/parts/registeredServer/serverGroupDialog/serverGroupViewModel';
import { attachModalDialogStyler } from 'sql/common/theme/styler';

export class ServerGroupDialog extends Modal {
	private _bodyBuilder: Builder;
	private _addServerButton: Button;
	private _closeButton: Button;
	private _colorCheckBoxesMap: Map<string, Checkbox> = new Map<string, Checkbox>();
	private _selectedColorOption: number;
	private _groupNameInputBox: InputBox;
	private _groupDescriptionInputBox: InputBox;
	private _viewModel: ServerGroupViewModel;


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
			this._groupNameInputBox = new InputBox(inputCellContainer.getHTMLElement(), this._contextViewService, {
				validationOptions: {
					validation: (value: string) => !value ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			});
		});

		// Connection Group Description
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			let groupDescriptionLabel = localize('groupDescription', 'Group description');
			labelContainer.innerHtml(groupDescriptionLabel);
		});
		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			this._groupDescriptionInputBox = new InputBox(inputCellContainer.getHTMLElement(), this._contextViewService);
		});

		// Connection Group Color
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			let groupColorLabel = localize('groupColor', 'Group color');
			labelContainer.innerHtml(groupColorLabel);
		});

		this._bodyBuilder.div({ class: 'group-color-options' }, (groupColorContainer) => {
			for (let i = 0; i < this._viewModel.colors.length; i++) {
				let color = this._viewModel.colors[i];

				let colorCheckBox = new Checkbox({
					actionClassName: 'server-group-color',
					title: color,
					isChecked: false,
					onChange: (viaKeyboard) => {
						this.onSelectGroupColor(color);
					}
				});
				colorCheckBox.domNode.style.backgroundColor = color;
				groupColorContainer.getHTMLElement().appendChild(colorCheckBox.domNode);

				// Theme styler
				this._register(attachCheckboxStyler(colorCheckBox, this._themeService));

				// add the new checkbox to the color map
				this._colorCheckBoxesMap.set(color, colorCheckBox);
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

	private isFocusOnColors(): boolean {

		/*
			//
			// intentionally leaving this code in for future work on tab and keyboard support
			// 7/28/2017: kenvh
			//
		this._colorCheckBoxesMap.forEach((checkbox: Checkbox, color: string) => {
			if (document.activeElement === checkbox.getElement === false) {
				checkbox.checked = true;
			}
		});
		*/

		return false;
	}

	private focusNext(): void {
		/*
			//
			// intentionally leaving this code in for future work on tab and keyboard support
			// 7/28/2017: kenvh
			//
		if (this._groupNameInputBox.hasFocus()) {
			this._groupDescriptionInputBox.focus();
		} else if (this._groupDescriptionInputBox.hasFocus()) {
			this._colorCheckBoxesMap[this._viewModel.groupColor].checkbox.focus();
		} else if (this.isFocusOnColors()) {
			this._addServerButton.focus();
		} else if (document.activeElement === this._addServerButton.getElement()) {
			this._closeButton.focus();
		}
		else if (document.activeElement === this._closeButton.getElement()) {
			this._groupNameInputBox.focus();
		}
		*/
	}

	private focusPrevious(): void {
		/*
			//
			// intentionally leaving this code in for future work on tab and keyboard support
			// 7/28/2017: kenvh
			//
		if (document.activeElement === this._closeButton.getElement()) {
			this._addServerButton.focus();
		} else if (document.activeElement === this._addServerButton.getElement()) {
			this._colorCheckBoxesMap[this._viewModel.groupColor].checkbox.focus();
		} else if (this.isFocusOnColors()) {
			this._groupDescriptionInputBox.focus();
		} else if (this._groupDescriptionInputBox.hasFocus()) {
			this._groupNameInputBox.focus();
		} else if (this._groupNameInputBox.hasFocus()) {
			this._closeButton.focus();
		}
		*/
	}

	private focusNextColor(moveRight: boolean): void {
		/*
			//
			// intentionally leaving this code in for future work on tab and keyboard support
			// 7/28/2017: kenvh
			//
		let focusIndex: number = -1;
			this._colorCheckBoxesMap.forEach((checkbox: Checkbox, color: string) => {
				if (document.activeElement === checkbox.domNode. === false) {
					checkbox.checked = true;
				}
			});


		for (let i = 0; i < this._colorCheckBoxesMap.size; i++) {
			if (this._colorCheckBoxesMap.values[i].hasFocus()) {
				focusIndex = i;
				break;
			}
		}

		if (focusIndex >= 0) {
			if (moveRight) {
				focusIndex++;
			}
			else {
				focusIndex--;
			}

			// check for wraps
			if (focusIndex < 0) {
				focusIndex = this._colorCheckBoxesMap.size - 1;
			} else if (focusIndex >= this._colorCheckBoxesMap.size) {
				focusIndex = 0;
			}
		}
		*/
	}

	private onSelectGroupColor(colorToSelect: string): void {
		this._viewModel.groupColor = colorToSelect;
		this.updateView();
	}

	private registerListeners(): void {
		// Theme styler
		this._register(attachInputBoxStyler(this._groupNameInputBox, this._themeService));
		this._register(attachInputBoxStyler(this._groupDescriptionInputBox, this._themeService));
		this._register(attachButtonStyler(this._addServerButton, this._themeService));
		this._register(attachButtonStyler(this._closeButton, this._themeService));

		// handler for name change events
		this._register(this._groupNameInputBox.onDidChange(groupName => {
			this.groupNameChanged(groupName);
		}));

		// handler for description change events
		this._register(this._groupDescriptionInputBox.onDidChange(groupDescription => {
			this.groupDescriptionChanged(groupDescription);
		}));
	}

	private groupNameChanged(groupName: string) {
		this._viewModel.groupName = groupName;
		this.updateView();
	}

	private groupDescriptionChanged(groupDescription: string) {
		this._viewModel.groupDescription = groupDescription;
		this.updateView();
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

	public get viewModel(): ServerGroupViewModel {
		return this._viewModel;
	}
	public set viewModel(theViewModel: ServerGroupViewModel) {
		this._viewModel = theViewModel;
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

	// initialize the view based on the current state of the view model
	private initializeView(): void {
		this.title = this._viewModel.getDialogTitle();
		this._groupNameInputBox.value = this._viewModel.groupName;
		this._groupDescriptionInputBox.value = this._viewModel.groupDescription;

		this.updateView();
	}

	// update UI elements that have derivative behaviors based on other state changes
	private updateView(): void {
		// check the color buttons and if their checked state does not match the view model state then correct it
		this._colorCheckBoxesMap.forEach((checkbox: Checkbox, color: string) => {
			if ((this._viewModel.groupColor === color) && (checkbox.checked === false)) {
				checkbox.checked = true;
			} else if ((this._viewModel.groupColor !== color) && (checkbox.checked === true)) {
				checkbox.checked = false;
			}
		});

		// OK button state - enabled if there are pending changes that can be saved
		this._addServerButton.enabled = this._viewModel.hasPendingChanges();
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

	public open() {
		// reset the dialog
		this.hideError();
		this.initializeView();
		this.show();
		this._groupNameInputBox.focus();
	}
}