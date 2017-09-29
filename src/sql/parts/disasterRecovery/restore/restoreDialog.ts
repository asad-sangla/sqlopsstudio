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
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachButtonStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { MessageType, IInputOptions } from 'vs/base/browser/ui/inputbox/inputBox';

import { SelectBox } from 'sql/base/browser/ui/selectBox/selectBox';
import { Checkbox } from 'sql/base/browser/ui/checkbox/checkbox';
import { Modal } from 'sql/parts/common/modal/modal';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { RestoreViewModel, RestoreOptionParam, SouceDatabaseNamesParam } from 'sql/parts/disasterRecovery/restore/restoreViewModel';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import { InputBox, OnLoseFocusParams } from 'sql/base/browser/ui/inputBox/inputBox';
import { attachModalDialogStyler, attachTableStyler, attachInputBoxStyler, attachSelectBoxStyler } from 'sql/common/theme/styler';
import { TableDataView } from 'sql/base/browser/ui/table/tableDataView';
import { Table } from 'sql/base/browser/ui/table/table';
import { RowSelectionModel } from 'sql/base/browser/ui/table/plugins/rowSelectionModel.plugin';
import { CheckboxSelectColumn } from 'sql/base/browser/ui/table/plugins/checkboxSelectColumn.plugin';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { DBLIST_SELECTOR } from 'sql/parts/common/dblist/dblist.component';
import { DbListComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { DbListModule } from 'sql/parts/common/dblist/dblist.module';
import { IDbListInterop } from 'sql/parts/common/dblist/dbListInterop';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as TelemetryKeys from 'sql/common/telemetryKeys';
import * as data from 'data';

interface FileListElement {
	logicalFileName: string;
	fileType: string;
	originalFileName: string;
	restoreAs: string;
}

export class RestoreDialog extends Modal implements IDbListInterop {
	public viewModel: RestoreViewModel;

	private _scriptButton: Button;
	private _restoreButton: Button;
	private _closeButton: Button;
	private _optionsMap: { [name: string]: Widget } = {};
	private _restoreLabel: string;
	private _restoreTitle: string;
	private _databaseTitle: string;
	private _backupFileTitle: string;
	private _ownerUri: string;

	// General options
	private _filePathInputBox: InputBox;
	private _destinationRestoreToInputBox: InputBox;
	private _restoreFromSelectBox: SelectBox;
	private _sourceDatabaseSelectBox: SelectBox;

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
	private _generalTabElement: HTMLElement;
	private _restoreFromBackupFileElement: HTMLElement;

	private _fileListTable: Table<FileListElement>;
	private _fileListData: TableDataView<FileListElement>;

	private _restorePlanTable: Table<Slick.SlickData>;
	private _restorePlanData: TableDataView<Slick.SlickData>;
	private _restorePlanColumn;

	private _onRestore = new Emitter<boolean>();
	public onRestore: Event<boolean> = this._onRestore.event;

	private _onValidate = new Emitter<void>();
	public onValidate: Event<void> = this._onValidate.event;

	private _onCancel = new Emitter<void>();
	public onCancel: Event<void> = this._onCancel.event;

	private _onDatabaseChanged = new Emitter<string>();
	public onDatabaseChanged: Event<string> = this._onDatabaseChanged.event;

	constructor(
		optionsMetadata: data.ServiceOption[],
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IContextViewService private _contextViewService: IContextViewService,
		@IBootstrapService private _bootstrapService: IBootstrapService,
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super(localize('RestoreDialogTitle', 'Restore database'), TelemetryKeys.Restore, partService, telemetryService, { hasErrors: true, isWide: true, hasSpinner: true });
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
		this._scriptButton = this.addFooterButton(localize('script', 'Script'), () => this.restore(true));
		this._restoreButton = this.addFooterButton(this._restoreLabel, () => this.restore(false));
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

			destinationContainer.div({ class: 'dialog-input-section' }, (inputContainer) => {
				inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
					labelContainer.innerHtml(localize('targetDatabase', 'Target database'));
				});

				inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
					// Get the bootstrap params and perform the bootstrap
					let params: DbListComponentParams = { dbListInterop: this, isEditable: true, width: '100%' };
					this._bootstrapService.bootstrap(
						DbListModule,
						inputCellContainer.getHTMLElement(),
						DBLIST_SELECTOR,
						params);
				});
			});

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
				this._restorePlanData = new TableDataView<Slick.SlickData>();
				this._restorePlanTable = new Table<Slick.SlickData>(labelContainer.getHTMLElement(), this._restorePlanData, this._restorePlanColumn, { enableColumnReorder: false });
				this._restorePlanTable.setSelectionModel(new RowSelectionModel({ selectActiveRow: false }));
				this._restorePlanTable.onSelectedRowsChanged((e, data) => this.backupFileCheckboxChanged(e, data));
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
				sectionContainer.div({ class: 'dialog-input-section restore-list' }, (fileNameContainer) => {
					let logicalFileName = localize('logicalFileName', 'Logical file Name');
					let fileType = localize('fileType', 'File type');
					let originalFileName = localize('originalFileName', 'Original File Name');
					let restoreAs = localize('restoreAs', 'Restore as');
					var columns = [{
						id: 'logicalFileName',
						name: logicalFileName,
						field: 'logicalFileName'
					}, {
						id: 'fileType',
						name: fileType,
						field: 'fileType'
					}, {
						id: 'originalFileName',
						name: originalFileName,
						field: 'originalFileName'
					}, {
						id: 'restoreAs',
						name: restoreAs,
						field: 'restoreAs'
					}];
					this._fileListData = new TableDataView<FileListElement>();
					this._fileListTable = new Table<FileListElement>(fileNameContainer.getHTMLElement(), this._fileListData, columns, { enableColumnReorder: false });
					this._fileListTable.setSelectionModel(new RowSelectionModel());
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
		let fileTableElement: HTMLElement;
		// create General, Files, and Options tabs
		$().div({ class: 'backup-dialog-tab' }, (rootContainer) => {
			tabElement = rootContainer.getHTMLElement();
			rootContainer.element('ul', { class: 'nav nav-tabs' }, (listContainer) => {
				this._generalTabElement = this.createTabList(listContainer, 'active general-tab', 'a.general', '#restore-general', localize('generalTitle', 'General'));
				fileTableElement = this.createTabList(listContainer, 'files-tab', 'a.file', '#restore-file', localize('filesTitle', 'Files'));
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

		jQuery(fileTableElement).on('shown.bs.tab', () => {
			if (this._fileListTable) {
				this._fileListTable.resizeCanvas();
				this._fileListTable.autosizeColumns();
			}
		});
	}

	public lookupUri(id: string): string {
		return this._ownerUri;
	}

	public databaseSelected(dbName: string): void {
		// Get the selected database when the controls lost focus (happens in databasesSelectedOnLostFocus)
	}

	public databasesSelectedOnLostFocus(dbName: string) {
		if (this.viewModel.targetDatabaseName !== dbName) {
			this.viewModel.targetDatabaseName = dbName;
			this._onValidate.fire();
		}
	}

	public databaseListInitialized(): void {
		this._onDatabaseChanged.fire(this.viewModel.targetDatabaseName);
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
				this._register(attachCheckboxStyler(propertyWidget, this._themeService));
				break;
			case ServiceOptionType.category:
				propertyWidget = this.createSelectBoxHelper(container, option.description, option.categoryValues.map(c => c.displayName), DialogHelper.getCategoryDisplayName(option.categoryValues, option.defaultValue));
				this._register(attachSelectBoxStyler(propertyWidget, this._themeService));
				this._register(propertyWidget.onDidSelect(selectedDatabase => {
					this.onCatagoryOptionChanged(optionName);
				}));
				break;
			case ServiceOptionType.string:
				propertyWidget = this.createInputBoxHelper(container, option.description);
				this._register(attachInputBoxStyler(propertyWidget, this._themeService));
				this._register(propertyWidget.onLoseFocus(params => {
					this.onStringOptionChanged(optionName, params);
				}));
		}

		this._optionsMap[optionName] = propertyWidget;
	}

	private onBooleanOptionChecked(optionName: string) {
		this.viewModel.setOptionValue(optionName, (<Checkbox>this._optionsMap[optionName]).checked);
		this.validateRestore();
	}

	private onCatagoryOptionChanged(optionName: string) {
		this.viewModel.setOptionValue(optionName, (<SelectBox>this._optionsMap[optionName]).value);
		this.validateRestore();
	}

	private onStringOptionChanged(optionName: string, params: OnLoseFocusParams) {
		if (params.hasChanged && params.value) {
			this.viewModel.setOptionValue(optionName, params.value);
			this.validateRestore();
		}
	}

	private createCheckBoxHelper(container: Builder, label: string, isChecked: boolean, onCheck: (viaKeyboard: boolean) => void): Checkbox {
		let checkbox: Checkbox;
		container.div({ class: 'dialog-input-section' }, (inputCellContainer) => {
			checkbox = DialogHelper.createCheckBox(inputCellContainer, label, 'restore-checkbox', isChecked, onCheck);
		});
		return checkbox;
	}

	private createSelectBoxHelper(container: Builder, label: string, options: string[], selectedOption: string): SelectBox {
		let selectBox: SelectBox;
		container.div({ class: 'dialog-input-section' }, (inputContainer) => {
			inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml(label);
			});

			inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
				selectBox = new SelectBox(options, selectedOption, inputCellContainer.getHTMLElement(), this._contextViewService);
				selectBox.render(inputCellContainer.getHTMLElement());
			});
		});
		return selectBox;
	}

	private createInputBoxHelper(container: Builder, label: string, options?: IInputOptions): InputBox {
		let inputBox: InputBox;
		container.div({ class: 'dialog-input-section' }, (inputContainer) => {
			inputContainer.div({ class: 'dialog-label' }, (labelContainer) => {
				labelContainer.innerHtml(label);
			});

			inputContainer.div({ class: 'dialog-input' }, (inputCellContainer) => {
				inputBox = new InputBox(inputCellContainer.getHTMLElement(), this._contextViewService, options);
			});
		});
		return inputBox;
	}

	public onValidateResponseFail(errorMessage: string) {
		this._restorePlanData.clear();
		this._fileListData.clear();
		this._restoreButton.enabled = false;
		this._scriptButton.enabled = false;
		if (this.isRestoreFromDatabaseSelected) {
			this._sourceDatabaseSelectBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
		} else {
			this._sourceDatabaseSelectBox.setOptions([]);
			this._filePathInputBox.showMessage({ type: MessageType.ERROR, content: errorMessage });
		}
	}

	public removeErrorMessage() {
		this._filePathInputBox.hideMessage();
		this._sourceDatabaseSelectBox.hideMessage();
		this._destinationRestoreToInputBox.hideMessage();
	}

	public enableRestoreButton(enabled: boolean) {
		this.hideSpinner();
		this._restoreButton.enabled = enabled;
		this._scriptButton.enabled = enabled;
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	private backupFileCheckboxChanged(e: Slick.EventData, data: Slick.OnSelectedRowsChangedEventArgs<Slick.SlickData>): void {
		let selectedFiles = [];
		data.grid.getSelectedRows().forEach(row => {
			selectedFiles.push(data.grid.getDataItem(row)['Id']);
		});

		let isSame = false;
		if (this.viewModel.selectedBackupSets && this.viewModel.selectedBackupSets.length === selectedFiles.length) {
			isSame = this.viewModel.selectedBackupSets.some(item => selectedFiles.includes(item));
		}

		if (!isSame) {
			this.viewModel.selectedBackupSets = selectedFiles;
			this.validateRestore();
		}
	}

	private registerListeners(): void {
		// Theme styler
		this._register(attachInputBoxStyler(this._filePathInputBox, this._themeService));
		this._register(attachInputBoxStyler(this._destinationRestoreToInputBox, this._themeService));
		this._register(attachSelectBoxStyler(this._restoreFromSelectBox, this._themeService));
		this._register(attachSelectBoxStyler(this._sourceDatabaseSelectBox, this._themeService));
		this._register(attachButtonStyler(this._scriptButton, this._themeService));
		this._register(attachButtonStyler(this._restoreButton, this._themeService));
		this._register(attachButtonStyler(this._closeButton, this._themeService));
		this._register(attachTableStyler(this._fileListTable, this._themeService));
		this._register(attachTableStyler(this._restorePlanTable, this._themeService));

		this._register(this._filePathInputBox.onLoseFocus(params => {
			this.onFilePathChanged(params);
		}));

		this._register(this._sourceDatabaseSelectBox.onDidSelect(selectedDatabase => {
			this.onSourceDatabaseChanged(selectedDatabase.selected);
		}));

		this._register(this._restoreFromSelectBox.onDidSelect(selectedRestoreFrom => {
			this.onRestoreFromChanged(selectedRestoreFrom.selected);
		}));
	}

	private onFilePathChanged(params: OnLoseFocusParams) {
		if (params.value) {
			if (params.hasChanged || (this.viewModel.filePath !== params.value)) {
				this.viewModel.filePath = params.value;
				this.viewModel.selectedBackupSets = null;
				this.validateRestore();
			}
		}
	}

	private onSourceDatabaseChanged(selectedDatabase: string) {
		this.viewModel.sourceDatabaseName = selectedDatabase;
		this.viewModel.selectedBackupSets = null;
		this.validateRestore();
	}

	private onRestoreFromChanged(selectedRestoreFrom: string) {
		this.removeErrorMessage();
		if (selectedRestoreFrom === this._backupFileTitle) {
			this.viewModel.onRestoreFromChanged(true);
			new Builder(this._restoreFromBackupFileElement).show();
		} else {
			this.viewModel.onRestoreFromChanged(false);
			new Builder(this._restoreFromBackupFileElement).hide();
		}
	}

	private get isRestoreFromDatabaseSelected(): boolean {
		return this._restoreFromSelectBox.value === this._databaseTitle;
	}

	public validateRestore(): void {
		this.showSpinner();
		this._onValidate.fire();
	}

	public restore(isScriptOnly: boolean): void {
		if (this._restoreButton.enabled) {
			this._onRestore.fire(isScriptOnly);
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
		this.restore(false);
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
		this._restorePlanData.clear();
		this._fileListData.clear();
		this._generalTabElement.click();
		this.removeErrorMessage();
	}

	public open(serverName: string, ownerUri: string) {
		this.title = this._restoreTitle + ' - ' + serverName;
		this._ownerUri = ownerUri;
		this._restoreButton.enabled = false;
		this._scriptButton.enabled = false;
		this.show();
		this._filePathInputBox.focus();
	}

	protected layout(height?: number): void {
		// Nothing currently laid out statically in this class
	}

	public dispose(): void {
		super.dispose();
		for (var key in this._optionsMap) {
			var widget: Widget = this._optionsMap[key];
			widget.dispose();
			delete this._optionsMap[key];
		}
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
		// Always adding an empty name as the first item so if the selected db name is not in the list,
		// The empty string would be selected and not the first db in the list
		let dbNames: string[] = [];
		if (this.isRestoreFromDatabaseSelected && databaseNamesParam.databaseNames
			&& databaseNamesParam.databaseNames.length > 0 && databaseNamesParam.databaseNames[0] !== '') {
			dbNames = [''].concat(databaseNamesParam.databaseNames);
		} else {
			dbNames = databaseNamesParam.databaseNames;
		}
		this._sourceDatabaseSelectBox.setOptions(dbNames);
		if (databaseNamesParam.selectedDatabase) {
			this._sourceDatabaseSelectBox.selectWithOptionName(databaseNamesParam.selectedDatabase);
		}
	}

	private updateTargetDatabaseName(value: string) {
		this._onDatabaseChanged.fire(value);
	}

	private updateRestoreOption(optionParam: RestoreOptionParam) {
		let widget = this._optionsMap[optionParam.optionName];
		if (widget) {
			if (widget instanceof Checkbox) {
				(<Checkbox>widget).checked = optionParam.value;
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			} else if (widget instanceof SelectBox) {
				(<SelectBox>widget).selectWithOptionName(optionParam.value);
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			} else if (widget instanceof InputBox) {
				(<InputBox>widget).value = optionParam.value;
				this.enableDisableWiget(widget, optionParam.isReadOnly);
			}
		}
	}

	private enableDisableWiget(widget: Checkbox | SelectBox | InputBox, isReadOnly: boolean) {
		if (isReadOnly) {
			widget.disable();
		} else {
			widget.enable();
		}
	}

	private updateRestoreDatabaseFiles(dbFiles: data.RestoreDatabaseFileInfo[]) {
		this._fileListData.clear();
		if (dbFiles) {
			let data = [];
			for (let i = 0; i < dbFiles.length; i++) {
				data[i] = {
					logicalFileName: dbFiles[i].logicalFileName,
					fileType: dbFiles[i].fileType,
					originalFileName: dbFiles[i].originalFileName,
					restoreAs: dbFiles[i].restoreAsFileName
				};
			}

			this._fileListData.push(data);
		}
	}

	private updateBackupSetsToRestore(backupSetsToRestore: data.DatabaseFileInfo[]) {
		this._restorePlanData.clear();
		if (backupSetsToRestore && backupSetsToRestore.length > 0) {
			if (!this._restorePlanColumn) {
				let firstRow = backupSetsToRestore[0];
				this._restorePlanColumn = firstRow.properties.map(item => {
					return {
						id: item.propertyName,
						name: item.propertyDisplayName,
						field: item.propertyName
					};
				});

				let checkboxSelectColumn = new CheckboxSelectColumn({ title: this._restoreLabel });
				this._register(attachCheckboxStyler(checkboxSelectColumn, this._themeService));
				this._restorePlanColumn.unshift(checkboxSelectColumn.getColumnDefinition());
				this._restorePlanTable.columns = this._restorePlanColumn;
				this._restorePlanTable.registerPlugin(checkboxSelectColumn);
				this._restorePlanTable.autosizeColumns();
			}

			let data = [];
			let selectedRow = [];
			for (let i = 0; i < backupSetsToRestore.length; i++) {
				let backupFile = backupSetsToRestore[i];
				let newData = {};
				for (let j = 0; j < backupFile.properties.length; j++) {
					newData[backupFile.properties[j].propertyName] = backupFile.properties[j].propertyValueDisplayName;
				}
				data.push(newData);
				if (backupFile.isSelected) {
					selectedRow.push(i);
				}
			}
			this._restorePlanData.push(data);
			this._restorePlanTable.setSelectedRows(selectedRow);
		}
	}
}