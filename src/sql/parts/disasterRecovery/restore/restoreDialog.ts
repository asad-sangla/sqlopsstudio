/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/restoreDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import dom = require('vs/base/browser/dom');
import { Button } from 'vs/base/browser/ui/button/button';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { MessageType, IInputOptions } from 'vs/base/browser/ui/inputbox/inputBox';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { Modal } from 'sql/parts/common/modal/modal';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IListService } from 'vs/platform/list/browser/listService';
import { attachInputBoxStyler, attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { localize } from 'vs/nls';
import data = require('data');

export class RestoreDialog extends Modal {
	private _restoreButton: Button;
	private _closeButton: Button;

	// General controls
	private _filePathInputBox: DialogInputBox;
	private _destinationDatabaseInputBox: DialogInputBox;
	private _destinationRestoreToInputBox: DialogInputBox;
	private _restoreFromSelectBox: DialogSelectBox;
	private _sourceDatabaseFromBackupSelectBox: DialogSelectBox;

	// File controls
	private _relocateFileCheckBox: Checkbox;
	private _relocatedDataFilePathInputBox: DialogInputBox;
	private _relocatedLogFilePathInputBox: DialogInputBox;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _restoreLabel: string;
	private _restoreTitle: string;
	private _backupFileTitle: string;

	// General elements
	private _restoreFromElement: HTMLElement;
	private _backupFileElement: HTMLElement;
	private _sourceDatabaseElement: HTMLElement;
	private _destinationElement: HTMLElement;
	private _restorePlanElement: HTMLElement;
	private _restorePlanListElement: HTMLElement;

	// File elements
	private _fileListElement: HTMLElement;

	private _onRestore = new Emitter<void>();
	public onRestore: Event<void> = this._onRestore.event;

	private _onValidate = new Emitter<void>();
	public onValidate: Event<void> = this._onValidate.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IListService private _listService: IListService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super('Restore database', partService, { hasErrors: true, isWide: true });
		this._restoreTitle = localize('restoreTitle', 'Restore database');
		this._backupFileTitle = localize('backupFile', 'Backup file');
		this._restoreLabel = localize('restore', 'Restore');
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		let cancelLabel = localize('cancel', 'Cancel');
		this._restoreButton = this.addFooterButton(this._restoreLabel, () => this.restore());
		this._closeButton = this.addFooterButton(cancelLabel, () => this.cancel());
		this.registerListeners();
	}

	protected renderBody(container: HTMLElement) {
		//Restore from section
		$().div({ class: 'backup-file-section' }, (restoreFromContainer) => {
			this._restoreFromElement = restoreFromContainer.getHTMLElement();
			restoreFromContainer.div({ class: 'dialog-label header' }, (labelContainer) => {
				let sourceLabel = localize('source', 'Source');
				labelContainer.innerHtml(sourceLabel);
			});

			restoreFromContainer.div({ class: 'restore-from-section' }, (restoreFromContainer) => {
				// Restore from
				this._restoreFromSelectBox = this.createSelectBoxHelper(restoreFromContainer, localize('restoreFrom', 'Restore from'), [this._backupFileTitle], this._backupFileTitle);
			});
		});

		// database section
		$().div({ class: 'source-database-section' }, (databaseSourceContainer) => {
			this._sourceDatabaseElement = databaseSourceContainer.getHTMLElement();
			this._sourceDatabaseFromBackupSelectBox = this.createSelectBoxHelper(databaseSourceContainer, localize('database', 'Database'), [], '');
		});

		// Backup file path
		let backupFilePathElement: HTMLElement;
		$().div({ class: 'backup-filepath-section' }, (backupFilePathContainer) => {
			backupFilePathElement = backupFilePathContainer.getHTMLElement();
			// Backup file path
			let errorMessage = localize('missingBackupFilePathError', 'Backup file path is required.');
			let validationOptions: IInputOptions = {
				validationOptions: {
					validation: (value: string) => DialogHelper.isEmptyString(value) ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			};
			this._filePathInputBox = this.createInputBoxHelper(backupFilePathContainer, localize('backupFilePath', 'Backup file path'), validationOptions);
		});

		// Backup file section
		$().div({ class: 'backup-file-section' }, (fileSourceContainer) => {
			this._backupFileElement = fileSourceContainer.getHTMLElement();
			fileSourceContainer.append(backupFilePathElement);
			fileSourceContainer.append(this._sourceDatabaseElement);
		});

		// Destination section
		$().div({ class: 'destination-section new-section' }, (destinationContainer) => {
			this._destinationElement = destinationContainer.getHTMLElement();

			destinationContainer.div({ class: 'dialog-label header' }, (labelContainer) => {
				labelContainer.innerHtml(localize('destination', 'Destination'));
			});

			// Database name
			this._destinationDatabaseInputBox = this.createInputBoxHelper(destinationContainer, localize('targetDatabase', 'Target database'));

			// Restore to
			this._destinationRestoreToInputBox = this.createInputBoxHelper(destinationContainer, localize('restoreTo', 'Restore to'));
		});


		// Restore plan section
		$().div({ class: 'restore-plan-section new-section' }, (restorePlanContainer) => {
			this._restorePlanElement = restorePlanContainer.getHTMLElement();
			restorePlanContainer.div({ class: 'dialog-label header' }, (labelContainer) => {
				let restorePlanLabel = localize('restorePlan', 'Restore plan');
				labelContainer.innerHtml(restorePlanLabel);
			});

			// Backup sets to restore
			restorePlanContainer.div({ class: 'dialog-label' }, (labelContainer) => {
				let backupSetsToRestoreLabel = localize('backupSetsToRestore', 'Backup sets to restore');
				labelContainer.innerHtml(backupSetsToRestoreLabel);
			});

			// Backup sets table
			restorePlanContainer.div({ class: 'dialog-input-section restore-list' }, (labelContainer) => {
				this._restorePlanListElement = labelContainer.getHTMLElement();
			});
		});

		// Content in General tab
		let generalContentElement;
		$().div({ class: 'restore-dialog tab-pane active', id: 'restore-general' }, (builder) => {
			generalContentElement = builder.getHTMLElement();
			builder.append(this._restoreFromElement);
			builder.append(this._backupFileElement);
			builder.append(this._destinationElement);
			builder.append(this._restorePlanElement);
		});

		// Content in file tab
		let fileContentElement;
		$().div({ class: 'restore-dialog tab-pane', id: 'restore-file' }, (builder) => {
			fileContentElement = builder.getHTMLElement();
			builder.div({ class: 'dialog-label header' }, (labelContainer) => {
				labelContainer.innerHtml(localize('restoreDatabaseFileAs', 'Restore database files as'));
			});

			let self = this;
			builder.div({ class: 'dialog-input-section' }, (inputCellContainer) => {
				let relocateFileCheckBoxLabel = localize('relocateAllFilesToFolder', 'Relocate all files to folder');
				this._relocateFileCheckBox = DialogHelper.createCheckBox(inputCellContainer, relocateFileCheckBoxLabel, 'sql-checkbox', false, (viaKeyboard: boolean) => self.onRelocatedFilesCheck(viaKeyboard));
			});

			builder.div({ class: 'sub-section' }, (inputCellContainer) => {
				this._relocatedDataFilePathInputBox = this.createInputBoxHelper(inputCellContainer, localize('datafileFolder', 'Data file folder'));
				this._relocatedDataFilePathInputBox.disable();
				this._relocatedLogFilePathInputBox = this.createInputBoxHelper(inputCellContainer, localize('logfileFolder', 'Log file folder'));
				this._relocatedLogFilePathInputBox.disable();
			});

			builder.div({ class: 'dialog-label header new-section' }, (labelContainer) => {
				labelContainer.innerHtml(localize('restoreDatabaseFileDetails', 'Restore database file details'));
			});

			// file list table
			builder.div({ class: 'dialog-input-section restore-list' }, (container) => {
				this._fileListElement = container.getHTMLElement();
			});
		});

		// Content in Options tab
		let optionsContentElement;
		$().div({ class: 'restore-dialog tab-pane', id: 'restore-options' }, (builder) => {
			optionsContentElement = builder.getHTMLElement();
			builder.innerHtml('Coming soon...');
		});

		let tabElement;
		// create General, Files, and Options tabs
		$().div({ class: 'backup-dialog-tab' }, (rootContainer) => {
			tabElement = rootContainer.getHTMLElement();
			rootContainer.element('ul', { class: 'nav nav-tabs' }, (listContainer) => {
				this.createTabList(listContainer, 'active general-tab', 'a.general', '#restore-general', localize('generalTitle', 'General'));
				this.createTabList(listContainer, 'files-tab', 'a.file', '#restore-file', localize('filesTitle', 'Files'));
				this.createTabList(listContainer, 'options-tab', 'a.options', '#restore-options', localize('optionsTitle', 'Options'));
			});
		});

		new Builder(container).div({ class: 'restore-dialog' }, (builder) => {
			builder.append(tabElement);
			builder.div({ class: 'tab-content' }, (contentContainer) => {
				contentContainer.append(generalContentElement);
				contentContainer.append(fileContentElement);
				contentContainer.append(optionsContentElement);
			});
		});
	}

	private onRelocatedFilesCheck(viaKeyboard: boolean): void {
		if (this._relocateFileCheckBox.checked) {
			this._relocatedDataFilePathInputBox.enable();
			this._relocatedLogFilePathInputBox.enable();
		} else {
			this._relocatedDataFilePathInputBox.disable();
			this._relocatedLogFilePathInputBox.disable();
		}
	}


	private createTabList(container: Builder, className: string, linkClassName: string, linkId: string, tabTitle: string): void {
		container.element('li', { class: className }, (linkContainer) => {
			let atag = dom.$(linkClassName);
			atag.setAttribute('data-toggle', 'tab');
			atag.setAttribute('href', linkId);
			atag.textContent = tabTitle;
			linkContainer.append(atag);
		});
	}

	private createSelectBoxHelper(container: Builder, label: string, options: string[], selectedOption: string): DialogSelectBox {
		var selectBox: DialogSelectBox;
		container.div({ class: 'dialog-input-section' }, (inputContainer) => {
			inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml(label);
			});

			inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
				selectBox = new DialogSelectBox(options, selectedOption);
				selectBox.render(inputCellContainer.getHTMLElement());
			});
		});
		return selectBox;
	}

	private createInputBoxHelper(container: Builder, label: string, options?: IInputOptions): DialogInputBox {
		var inputBox: DialogInputBox;
		container.div({ class: 'dialog-input-section' }, (inputContainer) => {
			inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml(label);
			});

			inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
				inputBox = new DialogInputBox(inputCellContainer.getHTMLElement(), this._contextViewService, options);
			});
		});
		return inputBox;
	}

	public onValidateResponse(canRestore: boolean, errorMessage: string, databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[], dbFiles: data.RestoreDatabaseFileInfo[]): void {
		this.resetTables();
		if (canRestore) {
			this.hideError();
			this._restoreButton.enabled = true;
			this.generateRestoreContent(databaseNames, backupSetsToRestore, dbFiles);
		} else {
			this._restoreButton.enabled = false;
			this._filePathInputBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
		}
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private generateRestoreContent(databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[], dbFiles: data.RestoreDatabaseFileInfo[]): void {
		if (databaseNames) {
			this._sourceDatabaseFromBackupSelectBox.setOptions(databaseNames, 0);
			this._destinationDatabaseInputBox.value = this._sourceDatabaseFromBackupSelectBox.value;
		}
		if (backupSetsToRestore && backupSetsToRestore.length > 0) {
			var container = new Builder(this._restorePlanListElement);
			container.element('table', { class: 'backup-table-content' }, (tableContainer) => {
				this.appendRowToBackupSetsTable(tableContainer, false, backupSetsToRestore[0]);
				backupSetsToRestore.forEach(file => {
					this.appendRowToBackupSetsTable(tableContainer, true, file);
				});
			});
		}
		if (dbFiles) {
			let columnNames = [localize('logicalFileName', 'Logical file Name'), localize('fileType', 'File type'), localize('originalFileName', 'Original File Name'), localize('Restore As', 'Restore as')];
			var container = new Builder(this._fileListElement);
			container.element('table', { class: 'backup-table-content' }, (tableContainer) => {
				tableContainer.element('tr', {}, (rowContainer) => {
					columnNames.forEach(columnName => {
						this.appendColumn(rowContainer, columnName);
					});
				});
				dbFiles.forEach(file => {
					this.appendRowToFileTable(tableContainer, file);
				});
			});
		}
	}

	private resetTables() {
		this._toDisposeTheming = lifecycle.dispose(this._toDisposeTheming);
		new Builder(this._restorePlanListElement).empty();
		new Builder(this._fileListElement).empty();
	}

	private appendRowToFileTable(container: Builder, file: data.RestoreDatabaseFileInfo): void {
		container.element('tr', {}, (rowContainer) => {
			this.appendColumn(rowContainer, file.logicalFileName);
			this.appendColumn(rowContainer, file.fileType);
			this.appendColumn(rowContainer, file.originalFileName);
			this.appendColumn(rowContainer, file.restoreAsFileName);
		});
	}

	private appendRowToBackupSetsTable(container: Builder, isData: boolean, databaseFileInfo: data.DatabaseFileInfo): void {
		container.element('tr', {}, (rowContainer) => {
			if (isData) {
				let checkbox = new Checkbox({
					actionClassName: 'sql-checkbox',
					title: '',
					isChecked: true,
					onChange: (viaKeyboard) => { }
				});

				rowContainer.element('td', { class: 'restore-data' }, (labelCellContainer) => {
					labelCellContainer.div({}, (checkboxContainer) => {
						checkboxContainer.append(checkbox.domNode);
					});
				});

				this._toDisposeTheming.push(attachCheckboxStyler(checkbox, this._themeService));

			} else {
				this.appendColumn(rowContainer, this._restoreLabel);
			}

			let properties = databaseFileInfo.properties;
			if (properties) {
				for (var i = 0; i < properties.length; i++) {
					let content = (isData) ? properties[i].propertyValueDisplayName : properties[i].propertyDisplayName;
					this.appendColumn(rowContainer, content);
				}
			}
		});
	}

	private appendColumn(rowContainer: Builder, content: string): void {
		rowContainer.element('td', { class: 'restore-data' }, (labelCellContainer) => {
			labelCellContainer.div({}, (labelContainer) => {
				labelContainer.innerHtml(content);
			});
		});
	}

	private registerListeners(): void {
		// Theme styler
		this._toDispose.push(attachInputBoxStyler(this._filePathInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._destinationDatabaseInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._destinationRestoreToInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._relocatedDataFilePathInputBox, this._themeService));
		this._toDispose.push(attachInputBoxStyler(this._relocatedLogFilePathInputBox, this._themeService));
		this._toDispose.push(attachSelectBoxStyler(this._restoreFromSelectBox, this._themeService));
		this._toDispose.push(attachSelectBoxStyler(this._sourceDatabaseFromBackupSelectBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));
		this._toDispose.push(attachCheckboxStyler(this._relocateFileCheckBox, this._themeService));

		this._toDispose.push(this._filePathInputBox.onDidChange(filePath => {
			this.filePathChanged(filePath);
		}));
	}

	private filePathChanged(filePath: string) {
		this._filePathInputBox.hideMessage();
		if (DialogHelper.isSubsetString(filePath.toLocaleLowerCase(), '.bak') ||
			DialogHelper.isSubsetString(filePath.toLocaleLowerCase(), '.trn') ||
			DialogHelper.isSubsetString(filePath.toLocaleLowerCase(), '.log')
		) {
			this._onValidate.fire();
		}
	}

	public get filePath(): string {
		return this._filePathInputBox.value;
	}

	public get databaseName(): string {
		return this._destinationDatabaseInputBox.value;
	}

	public set lastBackupTaken(content: string) {
		this._destinationRestoreToInputBox.value = content;
	}

	public get relocatedDataFilePath(): string {
		return this._relocatedDataFilePathInputBox.value;
	}

	public set relocatedDataFilePath(filePath: string) {
		this._relocatedDataFilePathInputBox.value = filePath ? filePath : '';
	}

	public get relocatedLogFilePath(): string {
		return this._relocatedLogFilePathInputBox.value;
	}

	public set relocatedLogFilePath(filePath: string) {
		this._relocatedLogFilePathInputBox.value = filePath ? filePath : '';
	}

	public set defaultBackupTailLog(useDefault: boolean) {
		this._relocateFileCheckBox.checked = !useDefault;
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
	}

	private resetDialog(): void {
		this.hideError();
		this._filePathInputBox.value = '';
		this._filePathInputBox.hideMessage();
		this._destinationDatabaseInputBox.value = '';
		this._destinationRestoreToInputBox.value = '';
		this._restoreFromSelectBox.selectWithOptionName(this._backupFileTitle);
		this._sourceDatabaseFromBackupSelectBox.setOptions([]);
		this._relocateFileCheckBox.checked = false;
		this._relocatedDataFilePathInputBox.disable();
		this._relocatedDataFilePathInputBox.value = '';
		this._relocatedLogFilePathInputBox.disable();
		this._relocatedLogFilePathInputBox.value = '';
		this.resetTables();
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