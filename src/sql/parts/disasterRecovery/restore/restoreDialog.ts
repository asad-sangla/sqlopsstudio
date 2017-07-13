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
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { Modal } from 'sql/parts/common/modal/modal';
import { DialogHelper } from 'sql/parts/common/modal/dialogHelper';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler, attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';

export class RestoreDialog extends Modal {
	private _bodyBuilder: Builder;
	private _summaryBuilder: Builder;
	private _relocateFolderElement: HTMLElement;
	private _restoreButton: Button;
	private _closeButton: Button;
	private _filePathInputBox: DialogInputBox;
	private _databaseInputBox: DialogInputBox;
	private _relocatedDataFilePathInputBox: DialogInputBox;
	private _relocatedLogFilePathInputBox: DialogInputBox;
	private _restoreFromSelectBox: DialogSelectBox;
	private _validateButton: Button;
	private _relocateFileCheckBox: Checkbox;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _spinner: HTMLElement;
	private _restoreDatabaseNameTitle: string;
	private _restoreDatabaseFileTitle: string;
	private _restoreTitle: string;
	private _backupFileTitle: string;

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
		this._backupFileTitle = localize('backupFile', 'Backup file');
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

		// Restore from
		this._bodyBuilder.div({ class: 'input-divider' }, (labelContainer) => {
			labelContainer.innerHtml('Restore from');
		});

		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			this._restoreFromSelectBox = new DialogSelectBox([this._backupFileTitle], this._backupFileTitle);
			this._restoreFromSelectBox.render(inputCellContainer.getHTMLElement());
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

		// Target database name
		this._bodyBuilder.div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Taget database name');
		});

		this._bodyBuilder.div({ class: 'input-divider' }, (inputCellContainer) => {
			this._databaseInputBox = DialogHelper.appendInputBox(inputCellContainer, {
				placeholder: '<Use backup file>'
			}, this._contextViewService);
		});

		let self = this;
		this._bodyBuilder.div({ class: 'dialog-label' }, (inputCellContainer) => {
			var relocateFileCheckBoxLabel = localize('relocateAllFilesToFolder', 'Relocate all files to folder');
			this._relocateFileCheckBox = DialogHelper.createCheckBox(inputCellContainer, relocateFileCheckBoxLabel,
				'sql-checkbox', false, (viaKeyboard: boolean) => self.onRelocatedFilesCheck(viaKeyboard));
		});

		// Relocated data files to folders
		let relocatedDataFileLabelBuilder = $().div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Data file folder');
		});
		let relocatedDataFileInputBoxBuilder = $().div({ class: 'dialog-label' }, (inputCellContainer) => {
			this._relocatedDataFilePathInputBox = DialogHelper.appendInputBox(inputCellContainer, {
				placeholder: '<Use default folder>'
			}, this._contextViewService);
		});

		// Relocated log files to folders
		let relocatedLogFileLabelBuilder = $().div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Log file folder');
		});
		let relocatedLogFileInputBoxBuilder = $().div({ class: 'dialog-label' }, (inputCellContainer) => {
			this._relocatedLogFilePathInputBox = DialogHelper.appendInputBox(inputCellContainer, {
				placeholder: '<Use default folder>'
			}, this._contextViewService);
		});

		this._bodyBuilder.div({ class: 'relocate-files-section' }, (builder) => {
			builder.hide();
			this._relocateFolderElement = builder.getHTMLElement();
			builder.append(relocatedDataFileLabelBuilder);
			builder.append(relocatedDataFileInputBoxBuilder);
			builder.append(relocatedLogFileLabelBuilder);
			builder.append(relocatedLogFileInputBoxBuilder);
		});

		// Preview Button
		this._validateButton = this.createValidateButton(this._bodyBuilder, 'Preview');

		// Summary section
		this._bodyBuilder.div({ class: 'summary' }, (summaryContainer) => {
			this._summaryBuilder = summaryContainer;
		});

	}

	private onRelocatedFilesCheck(viaKeyboard: boolean): void {
		if (this._relocateFileCheckBox.checked) {
			// todo: uncomment show() and hide() when we support specified folder path
			//new Builder(this._relocateFolderElement).show();
		} else {
			//new Builder(this._relocateFolderElement).hide();
		}
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
		this._summaryBuilder.empty();

		let restoreToContent;
		new Builder(this._summaryBuilder.getHTMLElement()).div({ class: 'summary-container' }, (builder) => {
			restoreToContent = builder;
		});

		// Summary
		restoreToContent.div({ class: 'modal-title' }, (labelContainer) => {
			labelContainer.innerHtml('Summary');
		});

		// Database name
		restoreToContent.div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Database name');
		});
		let databaseInputBox;
		restoreToContent.div({ class: 'input-divider' }, (inputCellContainer) => {
			databaseInputBox = DialogHelper.appendInputBox(inputCellContainer, null, this._contextViewService);
			databaseInputBox.value = databaseName;
			databaseInputBox.disable();
		});

		// Restore database files
		restoreToContent.div({ class: 'dialog-label' }, (labelContainer) => {
			labelContainer.innerHtml('Restore database files');
		});

		restoreToContent.div({ class: 'input-divider' }, (inputCellContainer) => {
			files.forEach(file => {
				inputCellContainer.div({ class: 'file-list-content' }, (fileContent) => {
					fileContent.innerHtml(file);
				});
			});
		});
	}

	private registerListeners(): void {
		// Theme styler
		this._toDispose.push(attachInputBoxStyler(this._filePathInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._databaseInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._relocatedDataFilePathInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._relocatedLogFilePathInputBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._validateButton, this._themeService));
		this._toDispose.push(attachSelectBoxStyler(this._restoreFromSelectBox, this._themeService));
		this._toDispose.push(attachCheckboxStyler(this._relocateFileCheckBox, this._themeService));

		this._toDispose.push(this._filePathInputBox.onDidChange(filePath => {
			this.filePathChanged(filePath);
		}));
	}

	private filePathChanged(filePath: string) {
		this._summaryBuilder.empty();
		this._filePathInputBox.hideMessage();
		if (this._restoreButton.enabled) {
			this._restoreButton.enabled = false;
		}
	}

	public get filePath(): string {
		return this._filePathInputBox.value;
	}

	public get databaseName(): string {
		return this._databaseInputBox.value;
	}

	public get relocatedDataFilePath(): string {
		return this._relocatedDataFilePathInputBox.value;
	}

	public get relocatedLogFilePath(): string {
		return this._relocatedLogFilePathInputBox.value;
	}

	public get relocateDbFiles(): boolean {
		return this._relocateFileCheckBox.checked;
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
		this.resetDialog();
		this.hide();
		this._summaryBuilder.empty();
	}

	private resetDialog(): void {
		this.hideSpinner();
		this.hideError();
		this._filePathInputBox.value = '';
		this._filePathInputBox.hideMessage();
		this._databaseInputBox.value = '';
		this._relocatedDataFilePathInputBox.value = '';
		this._relocatedLogFilePathInputBox.value = '';
		this._relocateFileCheckBox.checked = false;
		this._restoreFromSelectBox.selectWithOptionName(this._backupFileTitle);
	}

	public open(serverName: string) {
		this.title = this._restoreTitle + ' - ' + serverName;
		this._restoreButton.enabled = false;

		this.show();
		this._filePathInputBox.focus();
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}