/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/restoreDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Modal } from 'sql/parts/common/modal/modal';
import { DialogHelper } from 'sql/parts/common/modal/dialogHelper';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler, attachButtonStyler } from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';

export class RestoreDialog extends Modal {
	private _bodyBuilder: Builder;
	private _fileListBuilder: Builder;
	private _restoreButton: Button;
	private _closeButton: Button;
	private _filePathInputBox: DialogInputBox;
	private _validateButton: Button;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _spinner: HTMLElement;
	private _restoreDatabaseNameTitle: string;
	private _restoreDatabaseFileTitle: string;
	private _restoreTitle: string;

	private _onRestore = new Emitter<void>();
	public onRestore: Event<void> = this._onRestore.event;

	private _onValidate = new Emitter<void>();
	public onValidate: Event<void> = this._onValidate.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super('Restore database', partService, { hasErrors: true });
		this._restoreDatabaseNameTitle = localize('databaseNameTitle', 'Database name:');
		this._restoreDatabaseFileTitle = localize('restoreDatabaseFileTitle', 'Restore database files:');
		this._restoreTitle = localize('restoreTitle', 'Restore database');
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		this._restoreButton = this.addFooterButton('Restore', () => this.restore());
		this._closeButton = this.addFooterButton('Cancel', () => this.cancel());
		this.registerListeners();
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ class: 'restore-dialog' }, (builder) => {
			this._bodyBuilder = builder;
		});

		// Back up file path
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Backup file path');
		});

		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			var errorMessage = localize('missingBackupFilePathError', 'Backup file path is required.');
			this._filePathInputBox = DialogHelper.appendInputBox(inputCellContainer, {
				validationOptions: {
					validation: (value: string) => DialogHelper.isEmptyString(value) ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			}, this._contextViewService);
		});

		this._validateButton = this.createValidateButton(this._bodyBuilder, 'Validate');

		this._bodyBuilder.div({ class: 'file-list' }, (fileListContainer) => {
			this._fileListBuilder = fileListContainer;
		});

	}

	private createValidateButton(container: Builder, title: string): Button {
		let button;
		container.div({ class: 'validate-button' }, (divContainer) => {
			button = new Button(divContainer);
			button.label = title;
			button.addListener('click', () => {
				this.validateFile();
			});

			divContainer.div({ 'class': 'validate-spinner' }, (spinnerContainer) => {
				spinnerContainer.element('img', { 'class': 'hiddenSpinner' }, (spinnerElement) => {
					this._spinner = spinnerElement.getHTMLElement();
				});
			});
		});
		return button;
	}

	protected showSpinner(): void {
		this._spinner.setAttribute('class', 'spinner');
	}

	protected hideSpinner(): void {
		this._spinner.setAttribute('class', 'hiddenSpinner');
	}

	private validateFile(): void {
		this.hideError();
		if (this.validateInputs()) {
			this.showSpinner();
			this._onValidate.fire();
		}
	}

	public onValidateResponse(canRestore: boolean, errorMessage: string, databaseName: string, files: string[]): void {
		this.hideSpinner();
		if (canRestore) {
			this._restoreButton.enabled = true;
			this.showFileContent(databaseName, files);
		} else {
			this.setError(errorMessage);
		}
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private showFileContent(databaseName: string, files: string[]): void {
		this._fileListBuilder.empty();

		let fileListContent = $().div({ class: 'file-list-container' }, (fileListContainer) => {
			fileListContainer.div({ class: 'file-list-title' }, (propertyTitle) => {
				propertyTitle.innerHtml(this._restoreDatabaseNameTitle);
			});
			fileListContainer.div({ class: 'file-list-content' }, (fileContent) => {
				fileContent.innerHtml(databaseName);
			});
			fileListContainer.div({ class: 'file-list-title' }, (propertyTitle) => {
				propertyTitle.innerHtml(this._restoreDatabaseFileTitle);
			});
			files.forEach(file => {
				fileListContainer.div({ class: 'file-list-content' }, (fileContent) => {
					fileContent.innerHtml(file);
				});
			});
		});

		this._fileListBuilder.append(fileListContent);
	}

	private registerListeners(): void {
		// Theme styler
		this._toDispose.push(attachInputBoxStyler(this._filePathInputBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._validateButton, this._themeService));

		this._toDispose.push(this._filePathInputBox.onDidChange(filePath => {
			this.filePathChanged(filePath);
		}));
	}

	private filePathChanged(filePath: string) {
		this._fileListBuilder.empty();
		this._filePathInputBox.hideMessage();
		if (this._restoreButton.enabled) {
			this._restoreButton.enabled = false;
		}
	}

	public get filePath(): string {
		return this._filePathInputBox.value;
	}

	public restore(): void {
		if (this._restoreButton.enabled) {
			this._onRestore.fire();
		}
	}

	public hideError() {
		this.setError('');
	}

	private validateInputs(): boolean {
		let validate = this._filePathInputBox.validate();
		if (!validate) {
			this._filePathInputBox.focus();
		}
		return validate;
	}

	/* Overwrite esapce key behavior */
	protected onClose() {
		this.cancel();
	}

	/* Overwrite enter key behavior */
	protected onAccept() {
		this.restore();
	}

	public cancel() {
		this._onCancel.fire();
		this.close();
	}

	public close() {
		this.hideSpinner();
		this.hide();
		this._fileListBuilder.empty();
	}

	public open(serverName: string) {
		// reset the dialog
		this.hideError();
		this._filePathInputBox.value = '';
		this._filePathInputBox.hideMessage();

		this.title = this._restoreTitle + ' - ' + serverName;
		this._restoreButton.enabled = false;

		this.show();
		this._filePathInputBox.focus();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}