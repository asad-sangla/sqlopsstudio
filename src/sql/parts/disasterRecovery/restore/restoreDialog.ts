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
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { Widget } from 'vs/base/browser/ui/widget';
import { localize } from 'vs/nls';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IListService } from 'vs/platform/list/browser/listService';
import { attachInputBoxStyler, attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { MessageType, IInputOptions } from 'vs/base/browser/ui/inputbox/inputBox';

import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { DialogCheckbox } from 'sql/parts/common/modal/dialogCheckbox';
import { Modal } from 'sql/parts/common/modal/modal';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { RestoreViewModel, RestoreOptionParam, SouceDatabaseNamesParam } from 'sql/parts/disasterRecovery/restore/restoreViewModel';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { DialogInputBox, OnLoseFocusParams } from 'sql/parts/common/modal/dialogInputBox';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import * as data from 'data';

export class RestoreDialog extends Modal {
	public viewModel: RestoreViewModel;

	private _restoreButton: Button;
	private _closeButton: Button;
	private _optionsMap: { [name: string]: Widget } = {};
	private _backupSetsMap: { [name: string]: DialogCheckbox } = {};
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _restoreLabel: string;
	private _restoreTitle: string;
	private _databaseTitle: string;
	private _backupFileTitle: string;

	// General options
	private _filePathInputBox: DialogInputBox;
	private _destinationDatabaseInputBox: DialogInputBox;
	private _destinationRestoreToInputBox: DialogInputBox;
	private _restoreFromSelectBox: DialogSelectBox;
	private _sourceDatabaseSelectBox: DialogSelectBox;

	// File option
	private readonly _relocateDatabaseFilesOption = 'relocateDbFiles';
	private readonly _relocatedDataFileFolderOption = 'dataFileFolder';
	private readonly _relocatedLogFileFolderOption = 'logFileFolder';

	// other options
	private readonly _withReplaceDatabaseOption = 'replaceDatabase';
	private readonly _withKeepReplicationOption = 'keepReplication';
	private readonly _withRestrictedUserOption = 'setRestrictedUser';

	private readonly _recoveryStateOption = 'recoveryState';
	private readonly _standbyFileOption = 'standbyFile';

	private readonly _takeTaillogBackupOption = 'backupTailLog';
	private readonly _tailLogWithNoRecoveryOption = 'tailLogWithNoRecovery';
	private readonly _tailLogBackupFileOption = 'tailLogBackupFile';

	private readonly _closeExistingConnectionsOption = 'closeExistingConnections';

	// elements
	private _restorePlanListElement: HTMLElement;
	private _fileListElement: HTMLElement;
	private _generalTabElement: HTMLElement;
	private _restoreFromBackupFileElement: HTMLElement;

	private _onRestore = new Emitter<void>();
	public onRestore: Event<void> = this._onRestore.event;

	private _onValidate = new Emitter<void>();
	public onValidate: Event<void> = this._onValidate.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	constructor(
		optionsMetadata: data.ServiceOption[],
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IListService private _listService: IListService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super('Restore database', partService, { hasErrors: true, isWide: true });
		this._restoreTitle = localize('restoreTitle', 'Restore database');
		this._databaseTitle = localize('database', 'Database');
		this._backupFileTitle = localize('backupFile', 'Backup file');
		this._restoreLabel = localize('restore', 'Restore');

		// view model
		this.viewModel = new RestoreViewModel(optionsMetadata);
		this.viewModel.onSetLastBackupTaken((value) => this.updateLastBackupTaken(value));
		this.viewModel.onSetfilePath((value) => this.updateFilePath(value));
		this.viewModel.onSetSourceDatabaseNames((databaseNamesParam) => this.updateSourceDatabaseName(databaseNamesParam));
		this.viewModel.onSetTargetDatabaseName((value) => this.updateTargetDatabaseName(value));
		this.viewModel.onSetLastBackupTaken((value) => this.updateLastBackupTaken(value));
		this.viewModel.onSetRestoreOption((optionParams) => this.updateRestoreOption(optionParams));
		this.viewModel.onUpdateBackupSetsToRestore((backupSets) => this.updateBackupSetsToRestore(backupSets));
		this.viewModel.onUpdateRestoreDatabaseFiles((files) => this.updateRestoreDatabaseFiles(files));
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		let cancelLabel = localize('cancel', 'Cancel');
		this._restoreButton = this.addFooterButton(this._restoreLabel, () => this.restore());
		this._closeButton = this.addFooterButton(cancelLabel, () => this.cancel());
		this.registerListeners();
		this._destinationRestoreToInputBox.disable();
	}

	protected renderBody(container: HTMLElement) {

		let restoreFromElement;
		$().div({ class: 'restore-from' }, (restoreFromContainer) => {
			restoreFromElement = restoreFromContainer.getHTMLElement();
			this.createLabelElement(restoreFromContainer, localize('source', 'Source'), true);
			this._restoreFromSelectBox = this.createSelectBoxHelper(restoreFromContainer, localize('restoreFrom', 'Restore from'), [this._databaseTitle, this._backupFileTitle], this._databaseTitle);
		});

		$().div({ class: 'backup-file-path' }, (filePathContainer) => {
			filePathContainer.hide();
			this._restoreFromBackupFileElement = filePathContainer.getHTMLElement();
			let errorMessage = localize('missingBackupFilePathError', 'Backup file path is required.');
			let validationOptions: IInputOptions = {
				validationOptions: {
					validation: (value: string) => !value ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			};
			this._filePathInputBox = this.createInputBoxHelper(filePathContainer, localize('backupFilePath', 'Backup file path'), validationOptions);
		});

		let sourceDatabasesElement;
		$().div({ class: 'source-database-list' }, (sourceDatabasesContainer) => {
			sourceDatabasesElement = sourceDatabasesContainer.getHTMLElement();
			this._sourceDatabaseSelectBox = this.createSelectBoxHelper(sourceDatabasesContainer, localize('database', 'Database'), [], '');
		});

		// Source section
		let sourceElement: HTMLElement;
		$().div({ class: 'source-section new-section' }, (sourceContainer) => {
			sourceElement = sourceContainer.getHTMLElement();
			sourceContainer.append(restoreFromElement);
			sourceContainer.append(this._restoreFromBackupFileElement);
			sourceContainer.append(sourceDatabasesElement);
		});

		// Destination section
		let destinationElement: HTMLElement;
		$().div({ class: 'destination-section new-section' }, (destinationContainer) => {
			destinationElement = destinationContainer.getHTMLElement();
			this.createLabelElement(destinationContainer, localize('destination', 'Destination'), true);
			this._destinationDatabaseInputBox = this.createInputBoxHelper(destinationContainer, localize('targetDatabase', 'Target database'));
			this._destinationRestoreToInputBox = this.createInputBoxHelper(destinationContainer, localize('restoreTo', 'Restore to'));
		});


		// Restore plan section
		let restorePlanElement: HTMLElement;
		$().div({ class: 'restore-plan-section new-section' }, (restorePlanContainer) => {
			restorePlanElement = restorePlanContainer.getHTMLElement();
			this.createLabelElement(restorePlanContainer, localize('restorePlan', 'Restore plan'), true);
			this.createLabelElement(restorePlanContainer, localize('backupSetsToRestore', 'Backup sets to restore'));

			// Backup sets table
			restorePlanContainer.div({ class: 'dialog-input-section restore-list' }, (labelContainer) => {
				this._restorePlanListElement = labelContainer.getHTMLElement();
			});
		});

		// Content in general tab
		let generalContentElement: HTMLElement;
		$().div({ class: 'restore-dialog tab-pane active', id: 'restore-general' }, (builder) => {
			generalContentElement = builder.getHTMLElement();
			builder.append(sourceElement);
			builder.append(destinationElement);
			builder.append(restorePlanElement);
		});

		// Content in file tab
		let fileContentElement: HTMLElement;
		$().div({ class: 'restore-dialog tab-pane', id: 'restore-file' }, (builder) => {
			fileContentElement = builder.getHTMLElement();

			// Restore database file as section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('restoreDatabaseFileAs', 'Restore database files as'), true);
				this.creatOptionControl(sectionContainer, this._relocateDatabaseFilesOption);
				sectionContainer.div({ class: 'sub-section' }, (subSectionContainer) => {
					this.creatOptionControl(subSectionContainer, this._relocatedDataFileFolderOption);
					this.creatOptionControl(subSectionContainer, this._relocatedLogFileFolderOption);
				});
			});

			// Restore database file details section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('restoreDatabaseFileDetails', 'Restore database file details'), true);
				// file list table
				sectionContainer.div({ class: 'dialog-input-section restore-list' }, (container) => {
					this._fileListElement = container.getHTMLElement();
				});
			});
		});

		// Content in options tab
		let optionsContentElement: HTMLElement;
		$().div({ class: 'restore-dialog tab-pane', id: 'restore-options' }, (builder) => {
			optionsContentElement = builder.getHTMLElement();

			// Restore options section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('restoreOptions', 'Restore options'), true);
				this.creatOptionControl(sectionContainer, this._withReplaceDatabaseOption);
				this.creatOptionControl(sectionContainer, this._withKeepReplicationOption);
				this.creatOptionControl(sectionContainer, this._withRestrictedUserOption);
				this.creatOptionControl(sectionContainer, this._recoveryStateOption);

				sectionContainer.div({ class: 'sub-section' }, (subSectionContainer) => {
					this.creatOptionControl(subSectionContainer, this._standbyFileOption);
				});
			});

			// Tail-Log backup section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('taillogBackup', 'Tail-Log backup'), true);
				this.creatOptionControl(sectionContainer, this._takeTaillogBackupOption);
				sectionContainer.div({ class: 'sub-section' }, (subSectionContainer) => {
					this.creatOptionControl(subSectionContainer, this._tailLogWithNoRecoveryOption);
					this.creatOptionControl(subSectionContainer, this._tailLogBackupFileOption);
				});
			});

			// Server connections section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('serverConnection', 'Server connections'), true);
				this.creatOptionControl(sectionContainer, this._closeExistingConnectionsOption);
			});
		});

		let tabElement;
		// create General, Files, and Options tabs
		$().div({ class: 'backup-dialog-tab' }, (rootContainer) => {
			tabElement = rootContainer.getHTMLElement();
			rootContainer.element('ul', { class: 'nav nav-tabs' }, (listContainer) => {
				this._generalTabElement = this.createTabList(listContainer, 'active general-tab', 'a.general', '#restore-general', localize('generalTitle', 'General'));
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

	private createTabList(container: Builder, className: string, linkClassName: string, linkId: string, tabTitle: string): HTMLElement {
		let atag: HTMLElement;
		container.element('li', { class: className }, (linkContainer) => {
			atag = dom.$(linkClassName);
			atag.setAttribute('data-toggle', 'tab');
			atag.setAttribute('href', linkId);
			atag.textContent = tabTitle;
			linkContainer.append(atag);
		});

		return atag;
	}

	private createLabelElement(container: Builder, content: string, isHeader?: boolean) {
		let className = 'dialog-label';
		if (isHeader) {
			className += ' header';
		}
		container.div({ class: className }, (labelContainer) => {
			labelContainer.innerHtml(content);
		});
	}

	private creatOptionControl(container: Builder, optionName: string): void {
		let option = this.viewModel.getOptionMetadata(optionName);
		let propertyWidget: any;
		switch (option.valueType) {
			case ServiceOptionType.boolean:
				propertyWidget = this.createCheckBoxHelper(container, option.description,
					DialogHelper.getBooleanValueFromStringOrBoolean(option.defaultValue), () => this.onBooleanOptionChecked(optionName));
				this._toDispose.push(attachCheckboxStyler(propertyWidget, this._themeService));
				break;
			case ServiceOptionType.category:
				propertyWidget = this.createSelectBoxHelper(container, option.description, option.categoryValues.map(c => c.displayName), DialogHelper.getCategoryDisplayName(option.categoryValues, option.defaultValue));
				this._toDispose.push(attachSelectBoxStyler(propertyWidget, this._themeService));
				this._toDispose.push(propertyWidget.onDidSelect(selectedDatabase => {
					this.onCatagoryOptionChanged(optionName);
				}));
				break;
			case ServiceOptionType.string:
				propertyWidget = this.createInputBoxHelper(container, option.description);
				this._toDispose.push(attachInputBoxStyler(propertyWidget, this._themeService));
				this._toDispose.push(propertyWidget.onLoseFocus(params => {
					this.onStringOptionChanged(optionName, params);
				}));
		}

		this._optionsMap[optionName] = propertyWidget;
	}

	private onBooleanOptionChecked(optionName: string) {
		this.viewModel.setOptionValue(optionName, (<DialogCheckbox>this._optionsMap[optionName]).checked);
		this._onValidate.fire();
	}

	private onCatagoryOptionChanged(optionName: string) {
		this.viewModel.setOptionValue(optionName, (<DialogSelectBox>this._optionsMap[optionName]).value);
		this._onValidate.fire();
	}

	private onStringOptionChanged(optionName: string, params: OnLoseFocusParams) {
		if (params.hasChanged && params.value) {
			this.viewModel.setOptionValue(optionName, params.value);
			this._onValidate.fire();
		}
	}

	private createCheckBoxHelper(container: Builder, label: string, isChecked: boolean, onCheck: (viaKeyboard: boolean) => void): DialogCheckbox {
		let checkbox: DialogCheckbox;
		container.div({ class: 'dialog-input-section' }, (inputCellContainer) => {
			checkbox = DialogHelper.createCheckBox(inputCellContainer, label, 'sql-checkbox', isChecked, onCheck);
		});
		return checkbox;
	}

	private createSelectBoxHelper(container: Builder, label: string, options: string[], selectedOption: string): DialogSelectBox {
		let selectBox: DialogSelectBox;
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
		let inputBox: DialogInputBox;
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

	public onValidateResponseFail(errorMessage: string) {
		this.resetTables();
		this._filePathInputBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
	}

	public removeErrorMessage() {
		this._filePathInputBox.hideMessage();
	}

	public enableRestoreButton(enabled: boolean) {
		this._restoreButton.enabled = enabled;
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private resetTables() {
		this._toDisposeTheming = lifecycle.dispose(this._toDisposeTheming);
		new Builder(this._restorePlanListElement).empty();
		new Builder(this._fileListElement).empty();
		this.clearBackupSetsMap();
	}

	private appendRowToFileTable(container: Builder, file: data.RestoreDatabaseFileInfo): void {
		container.element('tr', {}, (rowContainer) => {
			this.appendColumn(rowContainer, file.logicalFileName);
			this.appendColumn(rowContainer, file.fileType);
			this.appendColumn(rowContainer, file.originalFileName);
			this.appendColumn(rowContainer, file.restoreAsFileName);
		});
	}

	private backupFileCheckboxChanged(fileId: string) {
		this.viewModel.setSelectedBackupFile(fileId, this._backupSetsMap[fileId].checked);
		this._onValidate.fire();
	}

	private appendRowToBackupSetsTable(container: Builder, isData: boolean, databaseFileInfo: data.DatabaseFileInfo): void {
		let self = this;
		container.element('tr', {}, (rowContainer) => {
			if (isData) {
				let checkbox = new DialogCheckbox({
					actionClassName: 'sql-checkbox',
					title: '',
					isChecked: databaseFileInfo.isSelected,
					onChange: (viaKeyboard) => {
						self.backupFileCheckboxChanged(databaseFileInfo.id);
					}
				});

				rowContainer.element('td', { class: 'restore-data' }, (labelCellContainer) => {
					labelCellContainer.div({}, (checkboxContainer) => {
						checkboxContainer.append(checkbox.domNode);
					});
				});

				this._toDisposeTheming.push(attachCheckboxStyler(checkbox, this._themeService));
				this._backupSetsMap[databaseFileInfo.id] = checkbox;
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
		this._toDispose.push(attachSelectBoxStyler(this._sourceDatabaseSelectBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));

		this._toDispose.push(this._filePathInputBox.onLoseFocus(params => {
			this.onFilePathChanged(params);
		}));

		this._toDispose.push(this._sourceDatabaseSelectBox.onDidSelect(selectedDatabase => {
			this.onSourceDatabaseChanged(selectedDatabase);
		}));

		this._toDispose.push(this._destinationDatabaseInputBox.onLoseFocus(params => {
			this.onTargetDatabaseChanged(params);
		}));

		this._toDispose.push(this._restoreFromSelectBox.onDidSelect(selectedRestoreFrom => {
			this.onRestoreFromChanged(selectedRestoreFrom);
		}));
	}

	private onFilePathChanged(params: OnLoseFocusParams) {
		if (params.value) {
			if (params.hasChanged || (this.viewModel.filePath !== params.value)) {
				this.viewModel.filePath = params.value;
				this.viewModel.emptyBackupSetsToRestore();
				this._onValidate.fire();
			}
		}
	}

	private onSourceDatabaseChanged(selectedDatabase: string) {
		this.viewModel.sourceDatabaseName = selectedDatabase;
		this.viewModel.emptyBackupSetsToRestore();
		this._onValidate.fire();
	}

	private onRestoreFromChanged(selectedRestoreFrom: string) {
		if (selectedRestoreFrom === this._backupFileTitle) {
			this.viewModel.onRestoreFromChanged(true);
			new Builder(this._restoreFromBackupFileElement).show();
		} else {
			this.viewModel.onRestoreFromChanged(false);
			new Builder(this._restoreFromBackupFileElement).hide();
		}
	}

	private onTargetDatabaseChanged(params: OnLoseFocusParams) {
		if (params.hasChanged && params.value) {
			this.viewModel.targetDatabaseName = params.value;
			this._onValidate.fire();
		}
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
		this._restoreFromSelectBox.selectWithOptionName(this._databaseTitle);
		this.onRestoreFromChanged(this._databaseTitle);
		this._sourceDatabaseSelectBox.select(0);
		this.resetTables();
		this._generalTabElement.click();
	}

	public open(serverName: string, databaseName: string) {
		this.title = this._restoreTitle + ' - ' + serverName;
		this._destinationDatabaseInputBox.value = databaseName;
		this._restoreButton.enabled = false;
		this.show();
		this._filePathInputBox.focus();
	}

	private clearBackupSetsMap() {
		for (var key in this._backupSetsMap) {
			this._backupSetsMap[key].dispose();
			delete this._backupSetsMap[key];
		}
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
		for (var key in this._optionsMap) {
			var widget: Widget = this._optionsMap[key];
			widget.dispose();
			delete this._optionsMap[key];
		}
		this.clearBackupSetsMap();
	}

	private updateLastBackupTaken(value: string) {
		this._destinationRestoreToInputBox.value = value;
	}

	private updateFilePath(value: string) {
		this._filePathInputBox.value = value;
		if (!value) {
			this._filePathInputBox.hideMessage();
		}
	}

	private updateSourceDatabaseName(databaseNamesParam: SouceDatabaseNamesParam) {
		this._sourceDatabaseSelectBox.setOptions(databaseNamesParam.databaseNames);
		if (databaseNamesParam.selectedDatabased) {
			this._sourceDatabaseSelectBox.selectWithOptionName(databaseNamesParam.selectedDatabased);
		}
	}

	private updateTargetDatabaseName(value: string) {
		this._destinationDatabaseInputBox.value = value;
	}

	private updateRestoreOption(optionParam: RestoreOptionParam) {
		let widget = this._optionsMap[optionParam.optionName];
		if (widget) {
			if (widget instanceof DialogCheckbox) {
				(<DialogCheckbox>widget).checked = optionParam.value;
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			} else if (widget instanceof DialogSelectBox) {
				(<DialogSelectBox>widget).selectWithOptionName(optionParam.value);
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			} else if (widget instanceof DialogInputBox) {
				(<DialogInputBox>widget).value = optionParam.value;
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			}
		}
	}

	private enableDisableWiget(widget: DialogCheckbox | DialogSelectBox | DialogInputBox, isReadOnly: boolean) {
		if (isReadOnly) {
			widget.disable();
		} else {
			widget.enable();
		}
	}

	private updateRestoreDatabaseFiles(dbFiles: data.RestoreDatabaseFileInfo[]) {
		if (dbFiles) {
			let columnNames = [localize('logicalFileName', 'Logical file Name'), localize('fileType', 'File type'), localize('originalFileName', 'Original File Name'), localize('Restore As', 'Restore as')];
			var container = new Builder(this._fileListElement);
			container.empty();
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

	private updateBackupSetsToRestore(backupSetsToRestore: data.DatabaseFileInfo[]) {
		this._toDisposeTheming = lifecycle.dispose(this._toDisposeTheming);
		this.clearBackupSetsMap();
		if (backupSetsToRestore && backupSetsToRestore.length > 0) {
			var container = new Builder(this._restorePlanListElement);
			container.empty();
			container.element('table', { class: 'backup-table-content' }, (tableContainer) => {
				this.appendRowToBackupSetsTable(tableContainer, false, backupSetsToRestore[0]);
				backupSetsToRestore.forEach(file => {
					this.appendRowToBackupSetsTable(tableContainer, true, file);
				});
			});
		}
	}
}