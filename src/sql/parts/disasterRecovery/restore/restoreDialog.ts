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
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { DialogInputBox, OnLoseFocusParams } from 'sql/parts/common/modal/dialogInputBox';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import * as data from 'data';

export interface RestoreOptionsElement {
	optionWidget: any;
	option: data.ServiceOption;
	optionValue: any;
}

export class RestoreDialog extends Modal {
	private _restoreButton: Button;
	private _closeButton: Button;
	private _optionPropertiesMap: { [name: string]: RestoreOptionsElement } = {};
	private _backupSetsMap: { [name: string]: DialogCheckbox } = {};
	private _toDispose: lifecycle.IDisposable[] = [];
	private _toDisposeTheming: lifecycle.IDisposable[] = [];
	private _restoreLabel: string;
	private _restoreTitle: string;
	private _backupFileTitle: string;

	// General options
	private _filePathInputBox: DialogInputBox;
	private _destinationDatabaseInputBox: DialogInputBox;
	private _destinationRestoreToInputBox: DialogInputBox;
	private _restoreFromSelectBox: DialogSelectBox;
	private _sourceDatabaseFromBackupSelectBox: DialogSelectBox;

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
		this._backupFileTitle = localize('backupFile', 'Backup file');
		this._restoreLabel = localize('restore', 'Restore');
		optionsMetadata.forEach(optionMedata => {
			this._optionPropertiesMap[optionMedata.name] = { optionWidget: null, option: optionMedata, optionValue: optionMedata.defaultValue };
		});
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
		// Source section
		let sourceElement: HTMLElement;
		$().div({ class: 'source-section new-section' }, (sourceContainer) => {
			sourceElement = sourceContainer.getHTMLElement();
			this.createLabelElement(sourceContainer, localize('source', 'Source'), true);

			this._restoreFromSelectBox = this.createSelectBoxHelper(sourceContainer, localize('restoreFrom', 'Restore from'), [this._backupFileTitle], this._backupFileTitle);

			let errorMessage = localize('missingBackupFilePathError', 'Backup file path is required.');
			let validationOptions: IInputOptions = {
				validationOptions: {
					validation: (value: string) => !value ? ({ type: MessageType.ERROR, content: errorMessage }) : null
				}
			};
			this._filePathInputBox = this.createInputBoxHelper(sourceContainer, localize('backupFilePath', 'Backup file path'), validationOptions);

			this._sourceDatabaseFromBackupSelectBox = this.createSelectBoxHelper(sourceContainer, localize('database', 'Database'), [], '');
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
				this.creatOptionControl(sectionContainer, this._relocateDatabaseFilesOption, false, () => this.onRelocatedFilesCheck());
				sectionContainer.div({ class: 'sub-section' }, (subSectionContainer) => {
					this.creatOptionControl(subSectionContainer, this._relocatedDataFileFolderOption, true);
					this.creatOptionControl(subSectionContainer, this._relocatedLogFileFolderOption, true);
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
					this.creatOptionControl(subSectionContainer, this._standbyFileOption, true);
				});
			});

			// Tail-Log backup section
			builder.div({ class: 'new-section' }, (sectionContainer) => {
				this.createLabelElement(sectionContainer, localize('taillogBackup', 'Tail-Log backup'), true);
				this.creatOptionControl(sectionContainer, this._takeTaillogBackupOption);
				sectionContainer.div({ class: 'sub-section' }, (subSectionContainer) => {
					this.creatOptionControl(subSectionContainer, this._tailLogWithNoRecoveryOption, true);
					this.creatOptionControl(subSectionContainer, this._tailLogBackupFileOption, true);
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

	private onRelocatedFilesCheck(): void {
		let relocateDatabaseFilesCheckBox = this._optionPropertiesMap[this._relocateDatabaseFilesOption].optionWidget;
		let relocatedDataFileInputBox = this._optionPropertiesMap[this._relocatedDataFileFolderOption].optionWidget;
		let relocatedLogFileInputBox = this._optionPropertiesMap[this._relocatedLogFileFolderOption].optionWidget;

		if (relocateDatabaseFilesCheckBox.checked) {
			relocatedDataFileInputBox.enable();
			relocatedLogFileInputBox.enable();
		} else {
			relocatedDataFileInputBox.disable();
			relocatedLogFileInputBox.disable();
		}
		this._onValidate.fire();
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

	private creatOptionControl(container: Builder, optionName: string, isDisabled?: boolean, onCheck?: (viaKeyboard: boolean) => void): void {
		let option = this._optionPropertiesMap[optionName].option;
		let propertyWidget: any;
		switch (option.valueType) {
			case ServiceOptionType.boolean:
				propertyWidget = this.createCheckBoxHelper(container, option.description, DialogHelper.getBooleanValueFromStringOrBoolean(option.defaultValue), onCheck);
				this._toDispose.push(attachCheckboxStyler(propertyWidget, this._themeService));
				break;
			case ServiceOptionType.category:
				propertyWidget = this.createSelectBoxHelper(container, option.description, option.categoryValues.map(c => c.displayName), DialogHelper.getCategoryDisplayName(option.categoryValues, option.defaultValue));
				this._toDispose.push(attachSelectBoxStyler(propertyWidget, this._themeService));
				this._toDispose.push(propertyWidget.onDidSelect(selectedDatabase => {
					this._onValidate.fire();
				}));
				break;
			case ServiceOptionType.string:
				propertyWidget = this.createInputBoxHelper(container, option.description);
				this._toDispose.push(attachInputBoxStyler(propertyWidget, this._themeService));
				this._toDispose.push(propertyWidget.onLoseFocus(params => {
					this.onInputBoxValidate(params);
				}));
		}
		if (propertyWidget && isDisabled) {
			propertyWidget.disable();
		}

		this._optionPropertiesMap[optionName].optionWidget = propertyWidget;
	}

	private createCheckBoxHelper(container: Builder, label: string, isChecked: boolean, onCheck?: (viaKeyboard: boolean) => void): DialogCheckbox {
		if (!onCheck) {
			onCheck = () => this._onValidate.fire();
		}
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

	public onValidateResponse(canRestore: boolean, errorMessage: string, databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[], dbFiles: data.RestoreDatabaseFileInfo[], planDetails: { [key: string]: any }): void {
		this.resetTables();
		if (canRestore) {
			this.hideError();
			this._restoreButton.enabled = true;
			this.generateRestoreContent(databaseNames, backupSetsToRestore, dbFiles, planDetails);
		} else {
			this._restoreButton.enabled = false;
			this._filePathInputBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
		}
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private generateRestoreContent(databaseNames: string[], backupSetsToRestore: data.DatabaseFileInfo[], dbFiles: data.RestoreDatabaseFileInfo[], planDetails: { [key: string]: any }): void {
		if (databaseNames) {
			this._sourceDatabaseFromBackupSelectBox.setOptions(databaseNames, 0);
			// todo: once the service gives the target database, the value should set to that
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

		if (planDetails) {
			for (var key in planDetails) {
				let mapKey = key;

				// todo: remove key modification after the restore service has changed the planDetails
				if (key.toLocaleLowerCase().includes('default')) {
					mapKey = key.slice(7, 8).toLocaleLowerCase() + key.slice(8);
				}
				let propertyElement = this._optionPropertiesMap[mapKey];
				if (propertyElement) {
					propertyElement.optionValue = planDetails[key];
					this.setValueToOptionElement(propertyElement, propertyElement.optionValue);
				}
			}
		}
	}

	private setValueToOptionElement(optionElement: RestoreOptionsElement, value: string) {
		switch (optionElement.option.valueType) {
			case ServiceOptionType.boolean:
				(<DialogCheckbox>optionElement.optionWidget).checked = DialogHelper.getBooleanValueFromStringOrBoolean(value);
				break;
			case ServiceOptionType.category:
				(<DialogSelectBox>optionElement.optionWidget).selectWithOptionName(DialogHelper.getCategoryDisplayName(optionElement.option.categoryValues, value));
				break;
			case ServiceOptionType.string:
				(<DialogInputBox>optionElement.optionWidget).value = value ? value : '';
		}
	}

	private resetOptionValue() {
		for (var key in this._optionPropertiesMap) {
			let propertyElement = this._optionPropertiesMap[key];
			propertyElement.optionValue = propertyElement.option.defaultValue;
			this.setValueToOptionElement(propertyElement, propertyElement.optionValue);
		}
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

	private appendRowToBackupSetsTable(container: Builder, isData: boolean, databaseFileInfo: data.DatabaseFileInfo): void {
		container.element('tr', {}, (rowContainer) => {
			if (isData) {
				let self = this;
				let checkbox = new DialogCheckbox({
					actionClassName: 'sql-checkbox',
					title: '',
					isChecked: databaseFileInfo.isSelected,
					onChange: (viaKeyboard) => {
						self._onValidate.fire();
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
		this._toDispose.push(attachSelectBoxStyler(this._sourceDatabaseFromBackupSelectBox, this._themeService));
		this._toDispose.push(attachButtonStyler(this._restoreButton, this._themeService));
		this._toDispose.push(attachButtonStyler(this._closeButton, this._themeService));

		this._toDispose.push(this._filePathInputBox.onLoseFocus(params => {
			this.onInputBoxValidate(params);
		}));

		this._toDispose.push(this._sourceDatabaseFromBackupSelectBox.onDidSelect(selectedDatabase => {
			this._onValidate.fire();
		}));

		this._toDispose.push(this._destinationDatabaseInputBox.onLoseFocus(params => {
			this.onInputBoxValidate(params);
		}));
	}

	private onInputBoxValidate(params: OnLoseFocusParams) {
		if (params.hasChanged && params.value) {
			this._onValidate.fire();
		}
	}

	public get filePath(): string {
		return this._filePathInputBox.value;
	}

	public get sourceDatabaseName(): string {
		return this._sourceDatabaseFromBackupSelectBox.value;
	}

	public get tagetDatabaseName(): string {
		return this._destinationDatabaseInputBox.value;
	}

	public set lastBackupTaken(content: string) {
		this._destinationRestoreToInputBox.value = content;
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

	public getRestoreAdvancedOptions(options: { [name: string]: any }) {
		for (let key in this._optionPropertiesMap) {
			let optionElement = this._optionPropertiesMap[key];
			let widgetValue;
			switch (optionElement.option.valueType) {
				case ServiceOptionType.boolean:
					widgetValue = (<DialogCheckbox>optionElement.optionWidget).checked;
					if (widgetValue !== DialogHelper.getBooleanValueFromStringOrBoolean(optionElement.optionValue)) {
						options[key] = widgetValue;
					}
					break;
				case ServiceOptionType.category:
					widgetValue = DialogHelper.getCategoryName(optionElement.option.categoryValues, (<DialogSelectBox>optionElement.optionWidget).value);
					if (widgetValue !== optionElement.optionValue) {
						options[key] = widgetValue;
					}
					break;
				case ServiceOptionType.string:
					widgetValue = (<DialogInputBox>optionElement.optionWidget).value;
					if (widgetValue && widgetValue !== optionElement.optionValue) {
						options[key] = widgetValue;
					}
			}
		}
	}

	public getSelectedBackupSets(): string[] {
		let selectedBackupSet;
		for (var key in this._backupSetsMap) {
			if (!selectedBackupSet) {
				selectedBackupSet = [];
			}
			var checkbox = this._backupSetsMap[key];
			if (checkbox.checked) {
				selectedBackupSet.push(key);
			}
		}
		return selectedBackupSet;
	}

	private resetDialog(): void {
		this.hideError();
		this._filePathInputBox.value = '';
		this._filePathInputBox.hideMessage();
		this._destinationDatabaseInputBox.value = '';
		this._destinationRestoreToInputBox.value = '';
		this._restoreFromSelectBox.selectWithOptionName(this._backupFileTitle);
		this._sourceDatabaseFromBackupSelectBox.setOptions([]);
		this.resetOptionValue();
		this.resetTables();
		this._generalTabElement.click();
	}

	public open(serverName: string) {
		this.title = this._restoreTitle + ' - ' + serverName;
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
		for (var key in this._optionPropertiesMap) {
			var widget: Widget = this._optionPropertiesMap[key].optionWidget;
			widget.dispose();
			delete this._optionPropertiesMap[key];
		}
		this.clearBackupSetsMap();
	}
}