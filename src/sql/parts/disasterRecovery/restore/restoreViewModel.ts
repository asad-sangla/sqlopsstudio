/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as data from 'data';
import { ServiceOptionType } from 'sql/parts/connection/common/connectionManagement';
import * as DialogHelper from 'sql/parts/common/modal/dialogHelper';

import Event, { Emitter } from 'vs/base/common/event';

export interface RestoreOptionsElement {
	optionMetadata: data.ServiceOption;
	defaultValue: any;
	currentValue: any;
}

/**
 * Parameters for setting the widget in the restore dialog
 */
export interface RestoreOptionParam {
	optionName: string;
	value: any;
	isReadOnly: boolean;
}

/**
 * Parameters for setting the list of source database names and selected database name in the restore dialog
 */
export interface SouceDatabaseNamesParam {
	databaseNames: string[];
	selectedDatabased: string;
}

/**
 * View model for restore dialog
 */
export class RestoreViewModel {
	public filePath: string;
	public sourceDatabaseName: string;
	public targetDatabaseName: string;
	public lastBackupTaken: string;

	private _onSetLastBackupTaken = new Emitter<string>();
	public onSetLastBackupTaken: Event<string> = this._onSetLastBackupTaken.event;

	private _onSetfilePath = new Emitter<string>();
	public onSetfilePath: Event<string> = this._onSetfilePath.event;

	private _onSetSourceDatabaseNames = new Emitter<SouceDatabaseNamesParam>();
	public onSetSourceDatabaseNames: Event<SouceDatabaseNamesParam> = this._onSetSourceDatabaseNames.event;

	private _onSetTargetDatabaseName = new Emitter<string>();
	public onSetTargetDatabaseName: Event<string> = this._onSetTargetDatabaseName.event;

	private _onSetRestoreOption = new Emitter<RestoreOptionParam>();
	public onSetRestoreOption: Event<RestoreOptionParam> = this._onSetRestoreOption.event;

	private _onUpdateBackupSetsToRestore = new Emitter<data.DatabaseFileInfo[]>();
	public onUpdateBackupSetsToRestore: Event<data.DatabaseFileInfo[]> = this._onUpdateBackupSetsToRestore.event;

	private _onUpdateRestoreDatabaseFiles = new Emitter<data.RestoreDatabaseFileInfo[]>();
	public onUpdateRestoreDatabaseFiles: Event<data.RestoreDatabaseFileInfo[]> = this._onUpdateRestoreDatabaseFiles.event;

	private _optionsMap: { [name: string]: RestoreOptionsElement } = {};
	public _backupSetToRestoreMap: { [name: string]: boolean } = {};

	constructor(optionsMetadata: data.ServiceOption[]) {
		optionsMetadata.forEach(optionMetadata => {
			let defaultValue = this.getDisplayValue(optionMetadata, optionMetadata.defaultValue);
			this._optionsMap[optionMetadata.name] = {
				optionMetadata: optionMetadata,
				defaultValue: defaultValue,
				currentValue: defaultValue
			};
		});
	}

	/**
 	* Get option display value
 	*/
	public getDisplayValue(optionMetadata: data.ServiceOption, optionValue: any): any {
		let displayValue: any;
		switch (optionMetadata.valueType) {
			case ServiceOptionType.boolean:
				displayValue = DialogHelper.getBooleanValueFromStringOrBoolean(optionValue);
				break;
			case ServiceOptionType.category:
				let optionName = optionValue;
				if (!optionName && optionMetadata.categoryValues[0]) {
					optionName = optionMetadata.categoryValues[0].name;
				}
				displayValue = DialogHelper.getCategoryDisplayName(optionMetadata.categoryValues, optionName);
				break;
			case ServiceOptionType.string:
				displayValue = optionValue ? optionValue : '';
		}
		return displayValue;
	}

	/**
 	* Get option metadata from the option map
 	*/
	public getOptionMetadata(optionName: string): data.ServiceOption {
		return this._optionsMap[optionName] ? this._optionsMap[optionName].optionMetadata : undefined;
	}

	/**
 	* Set restore option value
 	*/
	public setOptionValue(optionName: string, value: any): void {
		if (this._optionsMap[optionName]) {
			this._optionsMap[optionName].currentValue = value;
		}
	}

	/**
 	* Get restore advanced options. Only return the options that are different from the default options
 	*/
	public getRestoreAdvancedOptions(options: { [name: string]: any }) {
		for (let key in this._optionsMap) {
			let optionElement = this._optionsMap[key];
			switch (optionElement.optionMetadata.valueType) {
				case ServiceOptionType.boolean:
					if (optionElement.currentValue !== optionElement.defaultValue) {
						options[key] = optionElement.currentValue;
					}
					break;
				case ServiceOptionType.category:
					if (optionElement.currentValue !== optionElement.defaultValue) {
						options[key] = DialogHelper.getCategoryName(optionElement.optionMetadata.categoryValues, optionElement.currentValue);
					}
					break;
				case ServiceOptionType.string:
					if (optionElement.currentValue && optionElement.currentValue !== optionElement.defaultValue) {
						options[key] = optionElement.currentValue;
					}
			}
		}
	}

	/**
 	* On restore plan response will update all the information from restore plan response
 	*/
	public onRestorePlanResponse(restorePlanResponse: data.RestorePlanResponse): void {
		if (restorePlanResponse.planDetails && restorePlanResponse.planDetails['lastBackupTaken']) {
			this.updateLastBackupTaken(restorePlanResponse.planDetails['lastBackupTaken'].currentValue);
		}

		if (restorePlanResponse.planDetails && restorePlanResponse.planDetails['targetDatabaseName']) {
			this.updateTargetDatabaseName(restorePlanResponse.planDetails['targetDatabaseName'].currentValue);
		}
		this._onUpdateRestoreDatabaseFiles.fire(restorePlanResponse.dbFiles);
		this.updateSourceDatabaseNames(restorePlanResponse.databaseNamesFromBackupSets, restorePlanResponse.planDetails['sourceDatabaseName'].currentValue);
		this.updateOptionWithPlanDetail(restorePlanResponse.planDetails);
		this.updateBackupSetsToRestore(restorePlanResponse.backupSetsToRestore);
	}

	/**
 	* Update options with plan details
 	*/
	public updateOptionWithPlanDetail(planDetails: { [key: string]: any }): void {
		if (planDetails) {
			for (var key in planDetails) {
				let optionElement = this._optionsMap[key];
				if (optionElement) {
					let planDetailInfo = planDetails[key];
					optionElement.defaultValue = this.getDisplayValue(optionElement.optionMetadata, planDetailInfo.defaultValue);
					optionElement.currentValue = this.getDisplayValue(optionElement.optionMetadata, planDetailInfo.currentValue);
					this._onSetRestoreOption.fire({ optionName: key, value: this._optionsMap[key].currentValue, isReadOnly: planDetailInfo.isReadOnly });
				}
			}
		}
	}

	/**
 	* Empty the backup set to restore map
 	*/
	public emptyBackupSetsToRestore(): void {
		for (var key in this._backupSetToRestoreMap) {
			delete this._backupSetToRestoreMap[key];
		}
	}

	/**
 	* Update backup sets to restore
 	*/
	public updateBackupSetsToRestore(backupSetsToRestore: data.DatabaseFileInfo[]): void {
		if (backupSetsToRestore) {
			backupSetsToRestore.forEach(backupFile => {
				this._backupSetToRestoreMap[backupFile.id] = backupFile.isSelected;
			});
			this._onUpdateBackupSetsToRestore.fire(backupSetsToRestore);
		}
	}

	/**
 	* Get selected backup file
 	*/
	public getSelectedBackupSets(): string[] {
		let selectedBackupSet;
		for (var key in this._backupSetToRestoreMap) {
			if (!selectedBackupSet) {
				selectedBackupSet = [];
			}
			if (this._backupSetToRestoreMap[key]) {
				selectedBackupSet.push(key);
			}
		}
		return selectedBackupSet;
	}

	/**
 	* Set selected backup file
 	*/
	public setSelectedBackupFile(fileId: string, isSelected: boolean): void {
		if (this._backupSetToRestoreMap[fileId] !== undefined) {
			this._backupSetToRestoreMap[fileId] = isSelected;
		}
	}

	/**
 	* Reset restore options to the default value
 	*/
	public resetRestoreOptions(): void {
		this.updateSourceDatabaseNames([], '');
		this.updateFilePath('');
		this.updateTargetDatabaseName('');
		this.updateLastBackupTaken('');
		this.emptyBackupSetsToRestore();
		for (var key in this._optionsMap) {
			this._optionsMap[key].defaultValue = this.getDisplayValue(this._optionsMap[key].optionMetadata, this._optionsMap[key].optionMetadata.defaultValue);
			this._onSetRestoreOption.fire({ optionName: key, value: this._optionsMap[key].defaultValue, isReadOnly: false });
		}
	}

	/**
 	* Update last backup taken
 	*/
	public updateLastBackupTaken(value: string) {
		this.lastBackupTaken = value;
		this._onSetLastBackupTaken.fire(value);
	}

	/**
 	* Update file path
 	*/
	public updateFilePath(value: string) {
		this.filePath = value;
		this._onSetfilePath.fire(value);
	}

	/**
 	* Update source database names and selected database
 	*/
	public updateSourceDatabaseNames(options: string[], selectedDatabase: string) {
		this.sourceDatabaseName = selectedDatabase;
		this._onSetSourceDatabaseNames.fire({ databaseNames: options, selectedDatabased: selectedDatabase });
	}

	/**
 	* Update target database name
 	*/
	public updateTargetDatabaseName(value: string) {
		this.targetDatabaseName = value;
		this._onSetTargetDatabaseName.fire(value);
	}
}