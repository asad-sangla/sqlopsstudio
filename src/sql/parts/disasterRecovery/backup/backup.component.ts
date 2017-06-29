/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/disasterRecovery/backup/media/backupDialog';
import 'vs/css!sql/parts/common/flyoutDialog/media/flyoutDialog';
import 'vs/css!sql/media/primeng';
import data = require('data');
import { ElementRef, Component, Inject, forwardRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { PathUtilities } from 'sql/common/pathUtilities';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IDisasterRecoveryService, IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { BackupInfo } from 'data';
import { SelectItem } from 'primeng/primeng';
import { NgForm } from '@angular/forms';
import BackupConstants = require('sql/parts/disasterRecovery/backup/constants');

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

@Component({
	selector: BACKUP_SELECTOR,
	templateUrl: require.toUrl('sql/parts/disasterRecovery/backup/backup.component.html'),
	styleUrls: [require.toUrl('sql/parts/disasterRecovery/backup/media/backupDialog.css'),
                require.toUrl('sql/parts/common/flyoutDialog/media/flyoutDialog.css'),
                require.toUrl('sql/media/primeng.css')]
})
export class BackupComponent{
    @ViewChild('pathContainer', {read: ElementRef}) pathElement;
    @ViewChild('backupTypeContainer', {read: ElementRef}) backupTypeElement;
    @ViewChild('backupsetName', {read: ElementRef}) backupNameElement;
    @ViewChild('errorIcon', {read: ElementRef}) errorIconElement;

    private _disasterRecoveryService: IDisasterRecoveryService;
    private _disasterRecoveryUiService: IDisasterRecoveryUiService;
    private _uri: string;

    public connection: ConnectionManagementInfo;
	public databaseName: string;
    public defaultNewBackupFolder: string;
    public lastBackupLocations;
    public recoveryModel: string;
    public errorMessage: string = '';
    public labelOk = 'OK';
    public labelCancel = 'Cancel';

    // TODO: remove the style after theming is fixed
    public errorBorderStyle: string = '1px solid #BE1100';

    // UI element disable flag
    public disableFileComponent: boolean;
    public disableAdd: boolean;
    public disableRemove: boolean;
    public disableCopyOnly: boolean;

	// User input values
	public selectedBackupComponent: string;
    public selectedFilesText: string;
    public backupPathInput: string;
    public backupName: string;
    public isCopyOnly: boolean;

    // Dropdown list
	public listOfBackupTypes: SelectItem[];
    // Key: backup path, Value: device type
    public dictOfBackupPathDevice: {[path: string]: number};
    public urlBackupPaths: string[];

	constructor(
        @Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
        @Inject(forwardRef(() => ChangeDetectorRef)) private _changeDetectorRef: ChangeDetectorRef,
        @Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
        this.connection = dashboardParameters.connection;
        this._uri = dashboardParameters.ownerUri;
        this._disasterRecoveryService = _bootstrapService.disasterRecoveryService;
        this._disasterRecoveryUiService = _bootstrapService.disasterRecoveryUiService;
	}

    ngOnInit() {
        this.initialize();
        let self = this;

        this._disasterRecoveryService.getBackupConfigInfo(this._uri).then(configInfo => {
            if (configInfo) {
                self.lastBackupLocations = configInfo.latestBackups;
                self.defaultNewBackupFolder = configInfo.defaultBackupFolder;
                self.recoveryModel = configInfo.recoveryModel;

                self.setControlsForRecoveryModel();
                self.setDefaultBackupPaths();
                self.setDefaultBackupName();

                self._changeDetectorRef.detectChanges();
            }
        });
    }

    private initialize(): void {
        this.databaseName = this.connection.connectionProfile.databaseName;
        this.selectedBackupComponent = BackupConstants.labelDatabase;
        this.dictOfBackupPathDevice = {};
        this.urlBackupPaths = [];

        // Set focus on backup name
        this.backupNameElement.nativeElement.focus();
    }

    private validateInput(): boolean {
        if (this.getBackupPathCount() === 0) {
            this.errorMessage = 'Missing required fields';
        } else if (this.urlBackupPaths.length > 0) {
            this.errorMessage = 'Only disk backup is supported';
        }

        if (this.errorMessage !== '') {
            let iconFilePath = PathUtilities.toUrl('sql/parts/common/flyoutDialog/media/status-error.svg');
			this.errorIconElement.nativeElement.style.content = 'url(' + iconFilePath + ')';
            this.errorIconElement.nativeElement.style.visibility = 'visible'

            // highlight the backup path box
            this.pathElement.nativeElement.style.border = this.errorBorderStyle;

            this._changeDetectorRef.detectChanges();
            return false;
        } else {
            return true;
        }

    }

    public onOk(): void {
        // Verify input values
        if (this.validateInput()) {
            let backupPathArray = [];
            for (var i = 0; i < this.pathElement.nativeElement.childElementCount; i++) {
                backupPathArray.push(this.pathElement.nativeElement.children[i].innerHTML);
            }

            this._disasterRecoveryService.backup(this._uri,
            <data.BackupInfo>{
                ownerUri: this._uri,
                databaseName: this.databaseName,
                backupType: this.getBackupTypeNumber(),
                backupComponent: 0,
                backupDeviceType: 2, //Disk
                backupPathList: backupPathArray,
                selectedFiles: this.selectedFilesText,
                backupsetName: this.backupName,
                selectedFileGroup: undefined,
                backupPathDevices: this.dictOfBackupPathDevice,
                isCopyOnly: this.isCopyOnly
            });

            this._disasterRecoveryUiService.closeBackup();
        }
    }

	public onGenerateScript(): void {
    }

	public onCancel(): void {
        this._disasterRecoveryUiService.closeBackup();
    }

    public onFooterPressed(event: any): void {
        if (event.keyCode === 13) {
            if (event.currentTarget.innerHTML === this.labelOk) {
                this.onOk();
            }
            else if (event.currentTarget.innerHTML === this.labelCancel) {
                this.onCancel();
            }
        }
    }

    private setControlsForRecoveryModel(): void {
        let self = this;
		if (self.recoveryModel === BackupConstants.recoveryModelSimple) {
            self.selectedBackupComponent = BackupConstants.labelDatabase;
            self.disableFileComponent = true;
		} else {
            self.disableFileComponent = false;
		}

        self.populateBackupTypesCombo();
	}

    private populateBackupTypesCombo(): void {
        let self = this;
        self.addToBackupTypeList(BackupConstants.labelFull);
        if (self.databaseName !== 'master')  {
            self.addToBackupTypeList(BackupConstants.labelDifferential);
            if (self.recoveryModel !== BackupConstants.recoveryModelSimple) {
                self.addToBackupTypeList(BackupConstants.labelLog);
            }
        }
        self.backupTypeElement.nativeElement.SelectedIndex = 0;
    }

    private setDefaultBackupName(): void {
        let utc = new Date().toJSON().slice(0, 19);
        let self = this;
        self.backupName = self.databaseName + '-' + self.getSelectedBackupType() + '-' + utc;
    }

    private setDefaultBackupPaths(): void {
        let self = this;
        let previousBackupsCount = self.lastBackupLocations ? self.lastBackupLocations.length: 0;
        if (previousBackupsCount > 0) {
            for (var i = 0; i < previousBackupsCount; i++)  {
                let source = new RestoreItemSource(self.lastBackupLocations[i]);
                let isFile = self.isBackupToFile(source.restoreItemDeviceType);

                if (source.restoreItemDeviceType == BackupConstants.backupDeviceTypeURL) {
                    if (i == 0) {
                        self.urlBackupPaths.push(source.restoreItemLocation);
                        self.addToBackupPathList(source.restoreItemLocation);
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
                    self.addNonUrlBackupDestination(lastBackupLocation, destinationType);
                    self.addToBackupPathList(lastBackupLocation);
                }
            }
        } else if (self.defaultNewBackupFolder && self.defaultNewBackupFolder.length > 0)  {

            // TEMPORARY WORKAROUND: karlb 5/27 - try to guess path separator on server based on first character in path
            let serverPathSeparator: string = '\\';
            if (self.defaultNewBackupFolder[0] === '/') {
                serverPathSeparator = '/';
            }

            let defaultNewBackupLocation = self.defaultNewBackupFolder + serverPathSeparator + self.databaseName + '.bak';

            // Add a default new backup location
            self.addNonUrlBackupDestination(defaultNewBackupLocation, BackupConstants.deviceTypeFile);
            self.addToBackupPathList(defaultNewBackupLocation);
        }

        if (self.getBackupPathCount() > 0)  {
            self.pathElement.nativeElement.SelectedIndex = 0;
        }
    }

    private isBackupToFile(controllerType: number): boolean {
        let isfile = false;
        if (controllerType === 102) {
            isfile = true;
        }  else if (controllerType === 105)  {
            isfile = false;
        } else if (controllerType === BackupConstants.backupDeviceTypeDisk)  {
            isfile = true;
        }  else if (controllerType === BackupConstants.backupDeviceTypeTape || controllerType === BackupConstants.backupDeviceTypeURL) {
            isfile = false;
        }
        return isfile;
    }

// #region UI event handlers

    public onChangeCopyOnly(): void {
        this.isCopyOnly = !this.isCopyOnly;
        this._changeDetectorRef.detectChanges();
    }

	public onBackupTypeChanged(): void {
        if (this.getSelectedBackupType() === BackupConstants.labelDifferential) {
            this.isCopyOnly = false;
            this.disableCopyOnly = true;
        } else {
            this.disableCopyOnly = false;
        }

        this.setDefaultBackupName();
        this._changeDetectorRef.detectChanges();
	}

    private getBackupTypeNumber(): number {
        let backupType;
        switch(this.getSelectedBackupType()) {
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

    private addToBackupTypeList(backupType: string): void {
        let self = this;
        if (self.backupTypeElement) {
            var option = document.createElement('option');
            option.value = backupType;
            option.innerHTML = backupType;
            self.backupTypeElement.nativeElement.appendChild(option);
        }
    }

    private addToBackupPathList(backupPath: string): void {
        let self = this;
        if (self.pathElement) {
            var option = document.createElement('option');
            option.value = backupPath;
            option.innerHTML = backupPath;
            self.pathElement.nativeElement.appendChild(option);
        }
    }

    private getBackupPathCount(): number {
        let self = this;
        if (self.pathElement) {
            return self.pathElement.nativeElement.childElementCount;
        } else {
            return 0;
        }
    }

    private getSelectedBackupType(): string {
        let backupType = '';
        let self = this;
        if (self.backupTypeElement) {
            backupType = self.backupTypeElement.nativeElement.selectedOptions[0].innerHTML;
        }
        return backupType;
    }

    public onAddClick(): void {
        if (this.backupPathInput && this.backupPathInput.length > 0) {
            // Add it only if the path was not added previously
            if (!this.dictOfBackupPathDevice[this.backupPathInput]) {
                if ((this.getBackupPathCount() < BackupConstants.maxDevices - 1)) {
                    this.addToBackupPathList(this.backupPathInput);
                    this.dictOfBackupPathDevice[this.backupPathInput] = BackupConstants.deviceTypeFile;
                    this.disableRemove = false;
                }
                else
                {
                    this.disableAdd = true;
                }
            }

            // Reset the path text input
            this.backupPathInput = '';
            this._changeDetectorRef.detectChanges();
        }
    }

    public onRemoveClick(): void {
        let selectedCount = this.pathElement.nativeElement.selectedOptions.length;
        for (var i = 0; i < selectedCount; i++) {
            // Remove the first element from the selected list
            let backupPathElement = this.pathElement.nativeElement.selectedOptions[0];
            if (this.dictOfBackupPathDevice[backupPathElement.innerHTML]) {
                delete this.dictOfBackupPathDevice[backupPathElement.innerHTML];
            } else if (this.urlBackupPaths.indexOf(backupPathElement.innerHTML) !== -1) {
                delete this.urlBackupPaths[this.urlBackupPaths.indexOf(backupPathElement.innerHTML)];
            }
            this.pathElement.nativeElement.removeChild(backupPathElement);
        }

        if (this.getBackupPathCount() > 0) {
            this.pathElement.nativeElement.SelectedIndex = 0;
        } else {
            this.disableRemove = true;
        }

        this._changeDetectorRef.detectChanges();
    }

    private addNonUrlBackupDestination(bakLocation: string, bakDeviceType: number): void {
        let self = this;
        if (bakLocation.length > 0) {
            if (!(bakLocation in self.dictOfBackupPathDevice)) {
                self.dictOfBackupPathDevice[bakLocation] = bakDeviceType;
            }
        }
    }
}
