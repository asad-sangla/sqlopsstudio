/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/disasterRecovery/backup/media/backupDialog';
import 'vs/css!sql/media/primeng';
import { ElementRef, Component, Inject, forwardRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import BackupConstants = require('sql/parts/disasterRecovery/backup/constants');
import { IDisasterRecoveryService, IDisasterRecoveryUiService, TaskExecutionMode } from 'sql/parts/disasterRecovery/common/interfaces';
import { ModalFooterStyle } from 'sql/parts/common/modal/modal';
import { InputBox } from 'sql/base/browser/ui/inputBox/inputBox';
import { SelectBox } from 'sql/base/browser/ui/selectBox/selectBox';
import { ListBox } from 'sql/base/browser/ui/listBox/listBox';
import { Checkbox } from 'sql/base/browser/ui/checkbox/checkbox';
import { attachListBoxStyler, attachInputBoxStyler } from 'sql/common/theme/styler';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { Button } from 'vs/base/browser/ui/button/button';
import * as lifecycle from 'vs/base/common/lifecycle';
import { attachButtonStyler, attachSelectBoxStyler, attachCheckboxStyler } from 'vs/platform/theme/common/styler';
import { localize } from 'vs/nls';

export const BACKUP_SELECTOR: string = 'backup-component';

export class RestoreItemSource {
	restoreItemLocation: string;
	restoreItemDeviceType: number;
	isLogicalDevice: boolean;

	constructor(location: any) {
		this.restoreItemDeviceType = location.restoreItemDeviceType;
		this.restoreItemLocation = location.restoreItemLocation;
		this.isLogicalDevice = location.isLogicalDevice;
	}
}

interface MssqlBackupInfo {
	ownerUri: string;
	databaseName: string;
	backupType: number;
	backupComponent: number;
	backupDeviceType: number;
	selectedFiles: string;
	backupsetName: string;
	selectedFileGroup: { [path: string]: string };

	// List of {key: backup path, value: device type}
	backupPathDevices: { [path: string]: number };
	backupPathList: [string];
	isCopyOnly: boolean;
	formatMedia: boolean;
	initialize: boolean;
	skipTapeHeader: boolean;
	mediaName: string;
	mediaDescription: string;
	checksum: boolean;
	continueAfterError: boolean;
	logTruncation: boolean;
	tailLogBackup: boolean;
	retainDays: number;
	compressionOption: number;
	verifyBackupRequired: boolean;
	encryptionAlgorithm: number;
	encryptorType: number;
	encryptorName: string;
}

@Component({
	selector: BACKUP_SELECTOR,
	templateUrl: require.toUrl('sql/parts/disasterRecovery/backup/backup.component.html'),
	styleUrls: [require.toUrl('sql/parts/disasterRecovery/backup/media/backupDialog.css'),
	require.toUrl('sql/media/primeng.css')]
})
export class BackupComponent {
	@ViewChild('pathContainer', { read: ElementRef }) pathElement;
	@ViewChild('backupTypeContainer', { read: ElementRef }) backupTypeElement;
	@ViewChild('backupsetName', { read: ElementRef }) backupNameElement;
	@ViewChild('errorIcon', { read: ElementRef }) errorIconElement;
	@ViewChild('compressionContainer', { read: ElementRef }) compressionElement;
	@ViewChild('tlogOption', { read: ElementRef }) tlogOptionElement;
	@ViewChild('algorithmContainer', { read: ElementRef }) encryptionAlgorithmElement;
	@ViewChild('encryptorContainer', { read: ElementRef }) encryptorElement;
	@ViewChild('mediaName', { read: ElementRef }) mediaNameElement;
	@ViewChild('mediaDescription', { read: ElementRef }) mediaDescriptionElement;
	@ViewChild('advancedBody', { read: ElementRef }) advancedBodyElement;
	@ViewChild('advancedHeader', { read: ElementRef }) advancedHeaderElement;
	@ViewChild('recoveryModelContainer', { read: ElementRef }) recoveryModelElement;
	@ViewChild('backupDaysContainer', { read: ElementRef }) backupDaysElement;
	@ViewChild('backupButtonContainer', { read: ElementRef }) backupButtonElement;
	@ViewChild('cancelButtonContainer', { read: ElementRef }) cancelButtonElement;
	@ViewChild('addPathContainer', { read: ElementRef }) addPathElement;
	@ViewChild('removePathContainer', { read: ElementRef }) removePathElement;
	@ViewChild('pathInputContainer', { read: ElementRef }) pathInputElement;
	@ViewChild('copyOnlyContainer', { read: ElementRef }) copyOnlyElement;
	@ViewChild('encryptCheckContainer', { read: ElementRef }) encryptElement;
	@ViewChild('encryptContainer', { read: ElementRef }) encryptContainerElement;
	@ViewChild('verifyContainer', { read: ElementRef }) verifyElement;
	@ViewChild('checksumContainer', { read: ElementRef }) checksumElement;
	@ViewChild('continueOnErrorContainer', { read: ElementRef }) continueOnErrorElement;
	@ViewChild('encryptErrorContainer', { read: ElementRef }) encryptErrorElement;
	@ViewChild('modalFooterContainer', { read: ElementRef }) modalFooterElement;
	@ViewChild('scriptButtonContainer', { read: ElementRef }) scriptButtonElement;

	// tslint:disable:no-unused-variable
	private readonly backupNameLabel: string = localize('backup.backupName', 'Backup name');
	private readonly recoveryModelLabel: string = localize('backup.recoveryModel', 'Recovery model');
	private readonly backupTypeLabel: string = localize('backup.backupType', 'Backup type');
	private readonly backupDeviceLabel: string = localize('backup.backupDevice', 'Backup device');
	private readonly algorithmLabel: string = localize('backup.algorithm', 'Algorithm');
	private readonly certificateOrAsymmetricKeyLabel: string = localize('backup.certificateOrAsymmetricKey', 'Certificate or Asymmetric key');
	private readonly mediaLabel: string = localize('backup.media', 'media');
	private readonly mediaOptionLabel: string = localize('backup.mediaOption', 'Backup to the existing media set');
	private readonly mediaOptionFormatLabel: string = localize('backup.mediaOptionFormat', 'Backup to a new media set');
	private readonly existingMediaAppendLabel: string = localize('backup.existingMediaAppend', 'Append to the existing backup set');
	private readonly existingMediaOverwriteLabel: string = localize('backup.existingMediaOverwrite', 'Overwrite all existing backup sets');
	private readonly newMediaSetNameLabel: string = localize('backup.newMediaSetName', 'New media set name');
	private readonly newMediaSetDescriptionLabel: string = localize('backup.newMediaSetDescription', 'New media set description');
	private readonly checksumContainerLabel: string = localize('backup.checksumContainer', 'Perform checksum before writing to media');
	private readonly verifyContainerLabel: string = localize('backup.verifyContainer', 'Verify backup when finished');
	private readonly continueOnErrorContainerLabel: string = localize('backup.continueOnErrorContainer', 'Continue on error');
	private readonly expirationLabel: string = localize('backup.expiration', 'Expiration');
	private readonly setBackupRetainDaysLabel: string = localize('backup.setBackupRetainDays', 'Set backup retain days');
	// tslint:enable:no-unused-variable

	private _disasterRecoveryService: IDisasterRecoveryService;
	private _disasterRecoveryUiService: IDisasterRecoveryUiService;
	private _uri: string;
	private _toDispose: lifecycle.IDisposable[] = [];

	private connection: IConnectionProfile;
	private databaseName: string;
	private defaultNewBackupFolder: string;
	private lastBackupLocations;
	private recoveryModel: string;
	private backupEncryptors;
	private containsBackupToUrl: boolean;
	private errorMessage: string;

	// UI element disable flag
	private disableFileComponent: boolean;
	private disableTlog: boolean;

	private selectedBackupComponent: string;
	private selectedFilesText: string;
	private selectedInitOption: string;
	private isTruncateChecked: boolean;
	private isTaillogChecked: boolean;
	private isFormatChecked: boolean;
	private isEncryptChecked: boolean;
	// Key: backup path, Value: device type
	private backupPathTypePairs: { [path: string]: number };

	private compressionOptions = [BackupConstants.defaultCompression, BackupConstants.compressionOn, BackupConstants.compressionOff];
	private encryptionAlgorithms = [BackupConstants.aes128, BackupConstants.aes192, BackupConstants.aes256, BackupConstants.tripleDES];
	private existingMediaOptions = ["append", "overwrite"];
	private backupTypeOptions: string[];

	private backupTypeSelectBox: SelectBox;
	private backupNameBox: InputBox;
	private recoveryBox: InputBox;
	private backupRetainDaysBox: InputBox;
	private pathInputBox: InputBox;
	private backupButton: Button;
	private cancelButton: Button;
	private scriptButton: Button;
	private addPathButton: Button;
	private removePathButton: Button;
	private pathListBox: ListBox;
	private compressionSelectBox: SelectBox;
	private algorithmSelectBox: SelectBox;
	private encryptorSelectBox: SelectBox;
	private mediaNameBox: InputBox;
	private mediaDescriptionBox: InputBox;
	private copyOnlyCheckBox: Checkbox;
	private encryptCheckBox: Checkbox;
	private verifyCheckBox: Checkbox;
	private checksumCheckBox: Checkbox;
	private continueOnErrorCheckBox: Checkbox;

	constructor(
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeDetectorRef: ChangeDetectorRef,
		@Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService,
	) {
		let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
		this.connection = dashboardParameters.connection;
		this._uri = dashboardParameters.ownerUri;
		this._disasterRecoveryService = _bootstrapService.disasterRecoveryService;
		this._disasterRecoveryUiService = _bootstrapService.disasterRecoveryUiService;
	}

	ngOnInit() {
		let self = this;
		// Get backup configuration info
		this._disasterRecoveryService.getBackupConfigInfo(this._uri).then(configInfo => {
			if (configInfo) {
				self.lastBackupLocations = configInfo.latestBackups;
				self.defaultNewBackupFolder = configInfo.defaultBackupFolder;
				self.recoveryModel = configInfo.recoveryModel;
				self.backupEncryptors = configInfo.backupEncryptors;
				self.initialize(true);
			} else {
				self.initialize(false);
			}
		});
	}

	private initialize(isMetadataPopulated: boolean): void {
		this.databaseName = this.connection.databaseName;
		this.selectedBackupComponent = BackupConstants.labelDatabase;
		this.backupPathTypePairs = {};
		this.isFormatChecked = false;
		this.isEncryptChecked = false;
		this.selectedInitOption = this.existingMediaOptions[0];
		this.backupTypeOptions = [];

		// Set script footer button
		this.scriptButton = new Button(this.scriptButtonElement.nativeElement);
		this.scriptButton.label = 'Script';
		this._toDispose.push(this.scriptButton.addListener('click', () => this.onScript()));
		this._toDispose.push(attachButtonStyler(this.scriptButton, this._bootstrapService.themeService));

		// Set backup footer button
		this.backupButton = new Button(this.backupButtonElement.nativeElement);
		this.backupButton.label = 'Backup';
		this._toDispose.push(this.backupButton.addListener('click', () => this.onOk()));
		this._toDispose.push(attachButtonStyler(this.backupButton, this._bootstrapService.themeService));

		// Set cancel footer button
		this.cancelButton = new Button(this.cancelButtonElement.nativeElement);
		this.cancelButton.label = 'Cancel';
		this._toDispose.push(this.cancelButton.addListener('click', () => this.onCancel()));
		this._toDispose.push(attachButtonStyler(this.cancelButton, this._bootstrapService.themeService));

		if (isMetadataPopulated) {
			// Set recovery model
			this.setControlsForRecoveryModel();
			this.recoveryBox = new InputBox(this.recoveryModelElement.nativeElement, this._bootstrapService.contextViewService, { placeholder: this.recoveryModel });

			// Set backup type
			this.backupTypeSelectBox = new SelectBox(this.backupTypeOptions, this.backupTypeOptions[0]);
			this.backupTypeSelectBox.render(this.backupTypeElement.nativeElement);
			this.backupTypeSelectBox.onDidSelect(selected => this.onBackupTypeChanged());

			// Set copy-only check box
			this.copyOnlyCheckBox = new Checkbox({
				actionClassName: 'backup-checkbox',
				title: 'Copy-only backup',
				isChecked: false,
				onChange: (viaKeyboard) => { }
			});
			this.copyOnlyElement.nativeElement.appendChild(this.copyOnlyCheckBox.domNode);

			// Encryption checkbox
			let self = this;
			this.encryptCheckBox = new Checkbox({
				actionClassName: 'backup-checkbox',
				title: 'Encryption',
				isChecked: false,
				onChange: (viaKeyboard) => self.onChangeEncrypt()
			});
			this.encryptElement.nativeElement.appendChild(this.encryptCheckBox.domNode);

			// Verify backup checkbox
			this.verifyCheckBox = new Checkbox({
				actionClassName: 'backup-checkbox',
				title: 'Verify',
				isChecked: false,
				onChange: (viaKeyboard) => { }
			});
			this.verifyElement.nativeElement.appendChild(this.verifyCheckBox.domNode);

			// Perform checksum checkbox
			this.checksumCheckBox = new Checkbox({
				actionClassName: 'backup-checkbox',
				title: 'Perform checksum',
				isChecked: false,
				onChange: (viaKeyboard) => { }
			});
			this.checksumElement.nativeElement.appendChild(this.checksumCheckBox.domNode);

			// Continue on error checkbox
			this.continueOnErrorCheckBox = new Checkbox({
				actionClassName: 'backup-checkbox',
				title: 'Continue on error',
				isChecked: false,
				onChange: (viaKeyboard) => { }
			});
			this.continueOnErrorElement.nativeElement.appendChild(this.continueOnErrorCheckBox.domNode);

			// Set backup name
			this.backupNameBox = new InputBox(this.backupNameElement.nativeElement, this._bootstrapService.contextViewService);
			this.setDefaultBackupName();
			this.backupNameBox.focus();

			// Set backup path list
			this.setDefaultBackupPaths();
			var pathlist = [];
			for (var i in this.backupPathTypePairs) {
				pathlist.push(i);
			}
			this.pathListBox = new ListBox(pathlist, pathlist[0], this._bootstrapService.contextViewService);
			this.pathListBox.render(this.pathElement.nativeElement);

			// Set backup path input
			this.pathInputBox = new InputBox(this.pathInputElement.nativeElement, this._bootstrapService.contextViewService);
			this.addPathButton = new Button(this.addPathElement.nativeElement);
			this.addPathButton.label = '+';
			this.addPathButton.addListener('click', () => this.onAddClick());
			this.removePathButton = new Button(this.removePathElement.nativeElement);
			this.removePathButton.label = '-';
			this.removePathButton.addListener('click', () => this.onRemoveClick());

			// Set compression
			this.compressionSelectBox = new SelectBox(this.compressionOptions, this.compressionOptions[0]);
			this.compressionSelectBox.render(this.compressionElement.nativeElement);

			// Set encryption
			this.algorithmSelectBox = new SelectBox(this.encryptionAlgorithms, this.encryptionAlgorithms[0]);
			this.algorithmSelectBox.render(this.encryptionAlgorithmElement.nativeElement);
			var encryptorItems = this.populateEncryptorCombo();
			this.encryptorSelectBox = new SelectBox(encryptorItems, encryptorItems[0]);
			this.encryptorSelectBox.render(this.encryptorElement.nativeElement);

			// If no encryptor is provided, disable encrypt checkbox and show warning
			if (encryptorItems.length === 0) {
				this.encryptCheckBox.disable();
				let iconFilePath = require.toUrl('sql/workbench/errorMessageDialog/media/status-warning.svg');
				this.errorIconElement.nativeElement.style.content = 'url(' + iconFilePath + ')';
				this.errorMessage = localize('backup.noEncryptorError', "No certificate or asymmetric key is available");
			}

			// Set media
			this.mediaNameBox = new InputBox(this.mediaNameElement.nativeElement,
				this._bootstrapService.contextViewService,
				{
					validationOptions: {
						validation: (value: string) => !value ? ({ type: MessageType.ERROR, content: localize('backup.mediaNameRequired', 'Media name is required') }) : null
					}
				}
			);

			this._toDispose.push(this.mediaNameBox.onDidChange(mediaName => {
				this.mediaNameChanged(mediaName);
			}));

			this.mediaDescriptionBox = new InputBox(this.mediaDescriptionElement.nativeElement, this._bootstrapService.contextViewService);

			// Set backup retain days
			this.backupRetainDaysBox = new InputBox(this.backupDaysElement.nativeElement,
				this._bootstrapService.contextViewService,
				{
					placeholder: '0',
					type: 'number'
				});

			this.setTLogOptions();

			// apply theme
			this._toDispose.push(attachInputBoxStyler(this.backupNameBox, this._bootstrapService.themeService));
			this._toDispose.push(attachInputBoxStyler(this.recoveryBox, this._bootstrapService.themeService));
			this._toDispose.push(attachSelectBoxStyler(this.backupTypeSelectBox, this._bootstrapService.themeService));
			this._toDispose.push(attachListBoxStyler(this.pathListBox, this._bootstrapService.themeService));
			this._toDispose.push(attachInputBoxStyler(this.pathInputBox, this._bootstrapService.themeService));
			this._toDispose.push(attachButtonStyler(this.addPathButton, this._bootstrapService.themeService));
			this._toDispose.push(attachButtonStyler(this.removePathButton, this._bootstrapService.themeService));
			this._toDispose.push(attachSelectBoxStyler(this.compressionSelectBox, this._bootstrapService.themeService));
			this._toDispose.push(attachSelectBoxStyler(this.algorithmSelectBox, this._bootstrapService.themeService));
			this._toDispose.push(attachSelectBoxStyler(this.encryptorSelectBox, this._bootstrapService.themeService));
			this._toDispose.push(attachInputBoxStyler(this.mediaNameBox, this._bootstrapService.themeService));
			this._toDispose.push(attachInputBoxStyler(this.mediaDescriptionBox, this._bootstrapService.themeService));
			this._toDispose.push(attachInputBoxStyler(this.backupRetainDaysBox, this._bootstrapService.themeService));
			this._toDispose.push(attachCheckboxStyler(this.copyOnlyCheckBox, this._bootstrapService.themeService));
			this._toDispose.push(attachCheckboxStyler(this.encryptCheckBox, this._bootstrapService.themeService));
			this._toDispose.push(attachCheckboxStyler(this.verifyCheckBox, this._bootstrapService.themeService));
			this._toDispose.push(attachCheckboxStyler(this.checksumCheckBox, this._bootstrapService.themeService));
			this._toDispose.push(attachCheckboxStyler(this.continueOnErrorCheckBox, this._bootstrapService.themeService));

			// disable elements
			this.recoveryBox.disable();
			this.mediaNameBox.disable();
			this.mediaDescriptionBox.disable();

			// show warning message if latest backup file path contains url
			if (this.containsBackupToUrl) {
				this.pathListBox.setValidation(false, { content: localize('backup.containsBackupToUrlError', 'Only backup to file is supported'), type: MessageType.WARNING });
				this.pathListBox.focus();
			}
		} else {
			this.backupButton.enabled = false;
		}

		// set modal footer style
		(<HTMLElement>this.modalFooterElement.nativeElement).style.backgroundColor = ModalFooterStyle.backgroundColor;
		(<HTMLElement>this.modalFooterElement.nativeElement).style.borderTopWidth = ModalFooterStyle.borderTopWidth;
		(<HTMLElement>this.modalFooterElement.nativeElement).style.borderTopStyle = ModalFooterStyle.borderTopStyle;
		(<HTMLElement>this.modalFooterElement.nativeElement).style.borderTopColor = ModalFooterStyle.borderTopColor;

		this._changeDetectorRef.detectChanges();
	}

	/*
	* UI event handlers
	*/
	private onScript(): void {
		this._disasterRecoveryService.backup(this._uri, this.createBackupInfo(), TaskExecutionMode.script);
		this._disasterRecoveryUiService.closeBackup();
	}

	private onOk(): void {
		this._disasterRecoveryService.backup(this._uri, this.createBackupInfo(), TaskExecutionMode.executeAndScript);
		this._disasterRecoveryUiService.closeBackup();
	}

	private onCancel(): void {
		this._disasterRecoveryUiService.closeBackup();
		this._bootstrapService.connectionManagementService.disconnect(this._uri);
	}

	private onChangeTlog(): void {
		this.isTruncateChecked = !this.isTruncateChecked;
		this.isTaillogChecked = !this.isTaillogChecked;
		this.detectChange();
	}

	private onChangeEncrypt(): void {
		if (this.encryptCheckBox.checked) {
			(<HTMLElement>this.encryptContainerElement.nativeElement).style.display = 'inline';

			// Enable media options
			if (!this.isFormatChecked) {
				this.onChangeMediaFormat();
			}
		} else {
			(<HTMLElement>this.encryptContainerElement.nativeElement).style.display = 'none';
		}
		this.isEncryptChecked = this.encryptCheckBox.checked;
		this.detectChange();
	}

	private onChangeMediaFormat(): void {
		this.isFormatChecked = !this.isFormatChecked;
		this.enableMediaInput(this.isFormatChecked);
		if (this.isFormatChecked) {
			if (!this.mediaNameBox.value) {
				this.backupButton.enabled = false;
			}
		} else {
			this.enableBackupButton();
		}
		this.detectChange();
	}

	private onAdvancedClick(): void {
		if (this.advancedHeaderElement.nativeElement.style['aria-expanded']) {
			// collapse
			this.advancedHeaderElement.nativeElement.className = 'header collapsible collapsed';
			this.advancedBodyElement.nativeElement.style = 'display: none';
			this.advancedHeaderElement.nativeElement.style['aria-expanded'] = false;
		} else {
			// expand
			this.advancedHeaderElement.nativeElement.className = 'header collapsible';
			this.advancedBodyElement.nativeElement.style = 'display: inline';
			this.advancedHeaderElement.nativeElement.style['aria-expanded'] = true;
		}

		this.detectChange();
	}

	private onBackupTypeChanged(): void {
		if (this.getSelectedBackupType() === BackupConstants.labelDifferential) {
			this.copyOnlyCheckBox.checked = false;
			this.copyOnlyCheckBox.disable();
		} else {
			this.copyOnlyCheckBox.enable();
		}

		this.setTLogOptions();
		this.setDefaultBackupName();
		this._changeDetectorRef.detectChanges();
	}

	private onAddClick(): void {
		if (this.pathInputBox.value && this.pathInputBox.value.length > 0) {
			if (!this.backupPathTypePairs[this.pathInputBox.value]) {
				if ((this.getBackupPathCount() < BackupConstants.maxDevices)) {
					this.backupPathTypePairs[this.pathInputBox.value] = BackupConstants.deviceTypeFile;
					this.pathListBox.add(this.pathInputBox.value);
					this.enableBackupButton();

					// stop showing error message if the list content was invalid due to no file path
					if (!this.pathListBox.isContentValid && this.pathListBox.count === 1) {
						this.pathListBox.setValidation(true);
					}
				}
			}

			// Reset the path text input
			this.pathInputBox.value = '';
			this.enableAddRemoveButtons();
			this._changeDetectorRef.detectChanges();
		}
	}

	private onRemoveClick(): void {
		let self = this;
		this.pathListBox.selectedOptions.forEach(selected => {
			if (self.backupPathTypePairs[selected]) {
				if (self.backupPathTypePairs[selected] === BackupConstants.deviceTypeURL) {
					// stop showing warning message since url path is getting removed
					this.pathListBox.setValidation(true);
					this.containsBackupToUrl = false;
				}

				delete self.backupPathTypePairs[selected];
			}
		});

		this.pathListBox.remove();
		if (this.pathListBox.count === 0) {
			this.backupButton.enabled = false;

			// show input validation error
			this.pathListBox.setValidation(false, { content: localize('backup.backupFileRequired', 'Backup file path is required'), type: MessageType.ERROR });
			this.pathListBox.focus();
		}

		this.enableAddRemoveButtons();
		this._changeDetectorRef.detectChanges();
	}

	private enableAddRemoveButtons(): void {
		if (this.pathListBox.count === 0) {
			this.removePathButton.enabled = false;
		} else if (this.pathListBox.count === BackupConstants.maxDevices) {
			this.addPathButton.enabled = false;
		} else {
			this.removePathButton.enabled = true;
			this.addPathButton.enabled = true;
		}
	}

	/*
	* Helper methods
	*/
	private setControlsForRecoveryModel(): void {
		if (this.recoveryModel === BackupConstants.recoveryModelSimple) {
			this.selectedBackupComponent = BackupConstants.labelDatabase;
			this.disableFileComponent = true;
		} else {
			this.disableFileComponent = false;
		}

		this.populateBackupTypes();
	}

	private populateBackupTypes(): void {
		this.backupTypeOptions.push(BackupConstants.labelFull);
		if (this.databaseName !== 'master') {
			this.backupTypeOptions.push(BackupConstants.labelDifferential);
			if (this.recoveryModel !== BackupConstants.recoveryModelSimple) {
				this.backupTypeOptions.push(BackupConstants.labelLog);
			}
		}
	}

	private populateEncryptorCombo(): string[] {
		var encryptorCombo = [];
		this.backupEncryptors.forEach((encryptor) => {
			var encryptorTypeStr = (encryptor.encryptorType === 0 ? BackupConstants.serverCertificate : BackupConstants.asymmetricKey);
			encryptorCombo.push(encryptor.encryptorName + '(' + encryptorTypeStr + ')');
		});
		return encryptorCombo;
	}

	private setDefaultBackupName(): void {
		let utc = new Date().toJSON().slice(0, 19);
		if (this.backupNameBox) {
			this.backupNameBox.value = this.databaseName + '-' + this.getSelectedBackupType() + '-' + utc;
		}
	}

	private setDefaultBackupPaths(): void {
		let previousBackupsCount = this.lastBackupLocations ? this.lastBackupLocations.length : 0;
		if (previousBackupsCount > 0) {
			for (var i = 0; i < previousBackupsCount; i++) {
				let source = new RestoreItemSource(this.lastBackupLocations[i]);
				let isFile = this.isBackupToFile(source.restoreItemDeviceType);

				if (source.restoreItemDeviceType === BackupConstants.backupDeviceTypeURL) {
					if (i === 0) {
						this.backupPathTypePairs[source.restoreItemLocation] = BackupConstants.deviceTypeURL;
						this.containsBackupToUrl = true;
						break;
					}
				}

				let lastBackupLocation = source.restoreItemLocation;
				let destinationType = BackupConstants.deviceTypeLogicalDevice;
				if (source.isLogicalDevice === false) {
					if (isFile) {
						destinationType = BackupConstants.deviceTypeFile;
					} else {
						destinationType = BackupConstants.deviceTypeTape;
					}
				}

				if (lastBackupLocation.length > 0) {
					this.backupPathTypePairs[lastBackupLocation] = destinationType;
				}
			}
		} else if (this.defaultNewBackupFolder && this.defaultNewBackupFolder.length > 0) {

			// TEMPORARY WORKAROUND: karlb 5/27 - try to guess path separator on server based on first character in path
			let serverPathSeparator: string = '\\';
			if (this.defaultNewBackupFolder[0] === '/') {
				serverPathSeparator = '/';
			}

			let defaultNewBackupLocation = this.defaultNewBackupFolder + serverPathSeparator + this.databaseName + '.bak';

			// Add a default new backup location
			this.backupPathTypePairs[defaultNewBackupLocation] = BackupConstants.deviceTypeFile;
		}
	}

	private isBackupToFile(controllerType: number): boolean {
		let isfile = false;
		if (controllerType === 102) {
			isfile = true;
		} else if (controllerType === 105) {
			isfile = false;
		} else if (controllerType === BackupConstants.backupDeviceTypeDisk) {
			isfile = true;
		} else if (controllerType === BackupConstants.backupDeviceTypeTape || controllerType === BackupConstants.backupDeviceTypeURL) {
			isfile = false;
		}
		return isfile;
	}

	private enableMediaInput(enable: boolean): void {
		if (enable) {
			this.mediaNameBox.enable();
			this.mediaDescriptionBox.enable();
		} else {
			this.mediaNameBox.disable();
			this.mediaDescriptionBox.disable();
		}
	}

	private detectChange(): void {
		this._changeDetectorRef.detectChanges();
	}

	private setTLogOptions(): void {
		if (this.getSelectedBackupType() === BackupConstants.labelLog) {
			// Enable log options
			this.disableTlog = false;
			// Choose the default option
			this.isTruncateChecked = true;
		} else {
			// Unselect log options
			this.isTruncateChecked = false;
			this.isTaillogChecked = false;
			// Disable log options
			this.disableTlog = true;
		}
	}

	private getBackupTypeNumber(): number {
		let backupType;
		switch (this.getSelectedBackupType()) {
			case BackupConstants.labelFull:
				backupType = 0;
				break;
			case BackupConstants.labelDifferential:
				backupType = 1;
				break;
			case BackupConstants.labelLog:
				backupType = 2;
				break;
		}
		return backupType;
	}

	private getBackupPathCount(): number {
		return this.pathListBox.count;
	}

	private getSelectedBackupType(): string {
		let backupType = '';
		if (this.backupTypeSelectBox) {
			backupType = this.backupTypeSelectBox.value;
		}
		return backupType;
	}

	private enableBackupButton(): void {
		if (!this.backupButton.enabled) {
			if (this.pathListBox.count > 0 && (!this.isFormatChecked || this.mediaNameBox.value)) {
				this.backupButton.enabled = true;
			}
		}
	}

	private mediaNameChanged(mediaName: string): void {
		if (!mediaName) {
			this.backupButton.enabled = false;
		} else {
			this.enableBackupButton();
		}
	}

	private createBackupInfo(): MssqlBackupInfo {
		var backupPathArray = [];
		for (var i in this.backupPathTypePairs) {
			backupPathArray.push(i);
		}

		// get encryptor type and name
		var encryptorName = '';
		var encryptorType;

		if (this.encryptCheckBox.checked && this.encryptorSelectBox.value !== '') {
			var selectedEncryptor = this.encryptorSelectBox.value;
			var encryptorTypeStr = selectedEncryptor.substring(selectedEncryptor.lastIndexOf('(') + 1, selectedEncryptor.lastIndexOf(')'));
			encryptorType = (encryptorTypeStr === BackupConstants.serverCertificate ? 0 : 1);
			encryptorName = selectedEncryptor.substring(0, selectedEncryptor.lastIndexOf('('));
		}

		let backupInfo = <MssqlBackupInfo>{
			ownerUri: this._uri,
			databaseName: this.databaseName,
			backupType: this.getBackupTypeNumber(),
			backupComponent: 0,
			backupDeviceType: BackupConstants.backupDeviceTypeDisk,
			backupPathList: backupPathArray,
			selectedFiles: this.selectedFilesText,
			backupsetName: this.backupNameBox.value,
			selectedFileGroup: undefined,
			backupPathDevices: this.backupPathTypePairs,
			isCopyOnly: this.copyOnlyCheckBox.checked,

			// Get advanced options
			formatMedia: this.isFormatChecked,
			initialize: (this.isFormatChecked ? true : (this.selectedInitOption === this.existingMediaOptions[1])),
			skipTapeHeader: this.isFormatChecked,
			mediaName: (this.isFormatChecked ? this.mediaNameBox.value : ''),
			mediaDescription: (this.isFormatChecked ? this.mediaDescriptionBox.value : ''),
			checksum: this.checksumCheckBox.checked,
			continueAfterError: this.continueOnErrorCheckBox.checked,
			logTruncation: this.isTruncateChecked,
			tailLogBackup: this.isTaillogChecked,
			retainDays: DialogHelper.isNullOrWhiteSpace(this.backupRetainDaysBox.value) ? 0 : this.backupRetainDaysBox.value,
			compressionOption: this.compressionOptions.indexOf(this.compressionSelectBox.value),
			verifyBackupRequired: this.verifyCheckBox.checked,
			encryptionAlgorithm: (this.encryptCheckBox.checked ? this.encryptionAlgorithms.indexOf(this.algorithmSelectBox.value) : 0),
			encryptorType: encryptorType,
			encryptorName: encryptorName
		};

		return backupInfo;
	}
}
