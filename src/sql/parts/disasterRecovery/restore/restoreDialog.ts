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
	private _moreOptionButton: Button;
	private _filePathInputBox: DialogInputBox;
	private _destinationDatabaseInputBox: DialogInputBox;
	private _destinationRestoreToInputBox: DialogInputBox;
	private _restoreFromSelectBox: DialogSelectBox;
	private _sourceDatabaseFromBackupSelectBox: DialogSelectBox;
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _restoreLabel: string;
	private _restoreTitle: string;
	private _backupFileTitle: string;

	private _restoreFromElement: HTMLElement;
	private _backupFileElement: HTMLElement;
	private _sourceDatabaseElement: HTMLElement;
	private _destinationElement: HTMLElement;
	private _restorePlanElement: HTMLElement;
	private _restorePlanListElement: HTMLElement;

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
			restorePlanContainer.div({ class: 'restore-set-list' }, (labelContainer) => {
				this._restorePlanListElement = labelContainer.getHTMLElement();
			});
		});

		new Builder(container).div({ class: 'restore-dialog' }, (builder) => {
			builder.append(this._restoreFromElement);
			builder.append(this._backupFileElement);
			builder.append(this._destinationElement);
			builder.append(this._restorePlanElement);
			this._moreOptionButton = this.createMoreOptionButton(builder, localize('moreOptions', 'More Options...'), 'more-options-button');
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

	private createMoreOptionButton(container: Builder, title: string, className: string): Button {
		let button;
		container.div({ class: className }, (divContainer) => {
			button = new Button(divContainer);
			button.label = title;
			button.addListener('click', () => {
				// todo: open more option page
			});
		});
		return button;
	}

	public onValidateResponse(canRestore: boolean, errorMessage: string, databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[]): void {
		this.emptyBackupSetsTable();
		if (canRestore) {
			this.hideError();
			this._restoreButton.enabled = true;
			this.generateRestoreContent(databaseNames, backupSetsToRestore);
		} else {
			this._restoreButton.enabled = false;
			this._filePathInputBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
		}
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private generateRestoreContent(databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[]): void {
		if (databaseNames) {
			this._sourceDatabaseFromBackupSelectBox.setOptions(databaseNames, 0);
			this._destinationDatabaseInputBox.value = this._sourceDatabaseFromBackupSelectBox.value;
		}
		if (backupSetsToRestore && backupSetsToRestore.length > 0) {
			var container = new Builder(this._restorePlanListElement);
			container.element('table', { class: 'backup-sets-table-content' }, (tableContainer) => {
				this.appendRowToBackupSetsTable(tableContainer, false, backupSetsToRestore[0]);
				backupSetsToRestore.forEach(file => {
					this.appendRowToBackupSetsTable(tableContainer, true, file);
				});
			});

		}
	}

	private emptyBackupSetsTable() {
		this._toDisposeTheming = lifecycle.dispose(this._toDisposeTheming);
		new Builder(this._restorePlanListElement).empty();
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
		this._toDispose.push(attachSelectBoxStyler(this._restoreFromSelectBox, this._themeService));
		this._toDispose.push(attachSelectBoxStyler(this._sourceDatabaseFromBackupSelectBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._moreOptionButton, this._themeService));

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
		this.emptyBackupSetsTable();
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