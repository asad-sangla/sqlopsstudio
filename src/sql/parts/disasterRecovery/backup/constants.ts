/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Constants
export const maxDevices: number = 64;

// Constants for backup physical device type
export const backupDeviceTypeDisk = 2;
export const backupDeviceTypeTape = 5;
export const backupDeviceTypeURL = 9;

// Constants for backup media device type
export const deviceTypeLogicalDevice = 0;
export const deviceTypeTape = 1;
export const deviceTypeFile = 2;
export const deviceTypeURL = 5;

export const recoveryModelSimple = 'Simple';
export const recoveryModelFull = 'Full';

// Constants for UI strings
export const labelDatabase = 'Database';
export const labelFilegroup = 'Files and filegroups';
export const labelFull = 'Full';
export const labelDifferential = 'Differential';
export const labelLog = 'Transaction Log';
export const labelDisk = 'Disk';
export const labelUrl = 'Url';