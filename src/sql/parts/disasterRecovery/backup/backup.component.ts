/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/dashboard/media/dashboard';
import 'vs/css!sql/media/primeng';
import data = require('data');

import { ElementRef, Component, Inject, forwardRef, ViewChild, ChangeDetectorRef } from '@angular/core';

import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
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
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})

export class BackupComponent{
    @ViewChild('pathContainer', {read: ElementRef}) pathElement;
    @ViewChild('backupTypeContainer', {read: ElementRef}) backupTypeElement;

    private _disasterRecoveryService: IDisasterRecoveryService;
    private _uri: string;

    public connection: ConnectionManagementInfo;
	public databaseName: string;
    public defaultNewBackupFolder: string;
    public backupName: string;
    public lastBackupLocations;
    public recoveryModel: string;

    // UI element disable flag
    public disableDatabaseComponent: boolean;
    public disableFileComponent: boolean;
    public disableAdd: boolean;
    public disableRemove: boolean;
    public disableOk: boolean;

	// User input values
	public selectedBackupComponent: string;
    public selectedFilesText: string;
    public backupPathInput: string;

    // Dropdown list
	public listOfBackupTypes: SelectItem[];
    // Key: backup path, Value: device type
    public dictOfBackupPathDevice: {[path: string]: number};

	constructor(
        @Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
        @Inject(forwardRef(() => ChangeDetectorRef)) private _changeDetectorRef: ChangeDetectorRef,
        @Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
	) {
        let dashboardParameters: DashboardComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
        this.connection = dashboardParameters.connection;
        this._uri = dashboardParameters.ownerUri;
        this._disasterRecoveryService = _bootstrapService.disasterRecoveryService;
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
    }

    public onOk(): void {
        this.disableOk = true;
        let backupPathArray = [];
        for (var i = 0; i < this.pathElement.nativeElement.childElementCount; i++) {
            backupPathArray.push(this.pathElement.nativeElement.children[i].innerHTML);
        }

        this._disasterRecoveryService.backup(this._uri,
        <data.BackupInfo>{
            ownerUri: this._uri,
            databaseName: this.databaseName,
            backupType: this.getBackupTypeNumber(),
            backupComponent: 0, //TODO: change later when we have filegroup options (this.selectedBackupComponent === BackupConstants.labelDatabase ? 0 : 1),
            backupDeviceType: 2, //Disk
            backupPathList: backupPathArray,
            selectedFiles: this.selectedFilesText,
            backupsetName: this.backupName,
            selectedFileGroup: undefined,
            backupPathDevices: this.dictOfBackupPathDevice
        });
    }

	public onGenerateScript(): void {
    }

	public onCancel(): void {
    }

    public onSubmit(form: NgForm): void {
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
        let self = this;
        // TODO: change the format
        self.backupName = self.databaseName + '-' + self.getSelectedBackupType();
    }

    private setDefaultBackupPaths(): void {
        let self = this;
        let previousBackupsCount = self.lastBackupLocations ? self.lastBackupLocations.length: 0;
        let previousNonUrlBackupsCount = 0;
        let urlSelected = false;
        if (previousBackupsCount > 0) {
            for (var i = 0; i < previousBackupsCount; i++)  {
                let source = new RestoreItemSource(self.lastBackupLocations[i]);
                let isFile = self.isBackupToFile(source.restoreItemDeviceType);

                if (source.restoreItemDeviceType == BackupConstants.backupDeviceTypeURL) {
                    if (i == 0) {
                        // TODO: show URL backup
                        //Uri azureUri;
                        //Uri.TryCreate(source.RestoreItemLocation, UriKind.Absolute, out azureUri);
                        //urlSelected = true;

                        break;
                    }
                    continue;
                }

                previousNonUrlBackupsCount++;

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

            let defaultNewBackupLocation = self.defaultNewBackupFolder + serverPathSeparator + self.sanitizeFileName(self.databaseName) + '.bak';

            // Add a default new backup location
            self.addNonUrlBackupDestination(defaultNewBackupLocation, BackupConstants.deviceTypeFile);
            self.addToBackupPathList(defaultNewBackupLocation);
        }

        if (self.getBackupPathCount() > 0)  {
            self.pathElement.nativeElement.SelectedIndex = 0;
        }

        //TODO: add HADR check
        //self.UpdateHADRControls();
    }

    private sanitizeFileName(name: string): string {
     // @@ change this
     /*   char[] result = name.ToCharArray();
        string illegalCharacters = "\\/:*?\"<>|";
\ / : * ? " < > |
        int resultLength    = result.GetLength(0);
        int illegalLength   = illegalCharacters.Length;

        for (var resultIndex = 0; resultIndex < resultLength; resultIndex++)
        {
            for (var illegalIndex = 0; illegalIndex < illegalLength; illegalIndex++)
            {
                if (result[resultIndex] == illegalCharacters[illegalIndex])
                {
                    result[resultIndex] = '_';
                }
            }
        }
        return new string(result);
*/
        return name;
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

	public onBackupTypeChanged(): void {
        if (this.getSelectedBackupType() === BackupConstants.labelLog) {
            this.selectedBackupComponent = BackupConstants.labelDatabase;
            this.disableDatabaseComponent = true;
            this.disableFileComponent = true;
		} else {
            this.disableDatabaseComponent = false;

			if (this.recoveryModel !== BackupConstants.recoveryModelSimple) {
                this.disableFileComponent = false;
			}
		}
		//this.UpdateHADRControls();
		this.setDefaultBackupName();
        //this.enableActionButtons();
	}

	public onBackupComponentChanged(): void {
        if (this.selectedBackupComponent === BackupConstants.labelFilegroup) {
            //TODO: launch the filegroup browse dialog
            //this.GetSelectedFileGroupsFiles();
        }
        this.enableActionButtons();
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
                    //TODO: logical device type
                    this.disableRemove = false;
                }
                else
                {
                    this.disableAdd = true;
                }
            }

            // Reset the path text input
            this.backupPathInput = '';
        }

        this.enableActionButtons();
    }

    public onRemoveClick(): void {
        let selectedCount = this.pathElement.nativeElement.selectedOptions.length;
        for (var i = 0; i < selectedCount; i++) {
            // Remove the first element from the list
            let backupPathElement = this.pathElement.nativeElement.selectedOptions[0];
            delete this.dictOfBackupPathDevice[backupPathElement.innerHTML];
            this.pathElement.nativeElement.removeChild(backupPathElement);
        }

        if (this.getBackupPathCount() > 0) {
            this.pathElement.nativeElement.SelectedIndex = 0;
        } else {
            this.disableRemove = true;
        }

        this.enableActionButtons(); // enable only if destination is there
    }

/* TODO: Add remote file browser
    private listOfBackupPaths_SelectedIndexChanged(): void {
        int Count = this.listOfBackupPaths.SelectedItems.Count;
        this.setActionButtons(); // enable only if destination is there
    }
*/

    private addNonUrlBackupDestination(bakLocation: string, bakDeviceType: number): void {
        let self = this;
        if (bakLocation.length > 0) {
            if (!(bakLocation in self.dictOfBackupPathDevice)) {
                self.dictOfBackupPathDevice[bakLocation] = bakDeviceType;
            }
        }
    }

    // Enable/disable action buttons
	private enableActionButtons(): void {
		if (this.HaveSource() && this.HaveDestination()) {
            this.disableOk = false;
		} else {
            this.disableOk = true;
		}
	}

	private HaveSource(): boolean {
		// We have a database or files or transaction log to backup
		if ((this.selectedBackupComponent === BackupConstants.labelDatabase)
			|| (this.getSelectedBackupType() === BackupConstants.labelLog)
            || (this.selectedFilesText.length > 0)) {
			return true;
		} else {
			return false;
		}
	}

	private HaveDestination(): boolean {
        if (this.getBackupPathCount() > 0) {
            return true;
        }
        return false;
	}
}
