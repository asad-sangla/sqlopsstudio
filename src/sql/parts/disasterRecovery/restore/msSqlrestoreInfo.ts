/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import data = require('data');

export class MssqlRestoreInfo implements data.RestoreInfo {

	options: { [name: string]: any };

	public constructor() {
		this.options = {};
	}

	public get sessionId(): string {
		return this.options['sessionId'];
	}

	public set sessionId(value: string) {
		this.options['sessionId'] = value;
	}

	public get backupFilePaths(): string {
		return this.options['backupFilePaths'];
	}

	public set backupFilePaths(value: string) {
		this.options['backupFilePaths'] = value;
	}

	public get targetDatabaseName(): string {
		return this.options['targetDatabaseName'];
	}

	public set targetDatabaseName(value: string) {
		this.options['targetDatabaseName'] = value;
	}

	public get sourceDatabaseName(): string {
		return this.options['sourceDatabaseName'];
	}

	public set sourceDatabaseName(value: string) {
		this.options['sourceDatabaseName'] = value;
	}

	public get relocateDbFiles(): boolean {
		return this.options['relocateDbFiles'];
	}

	public set relocateDbFiles(value: boolean) {
		this.options['relocateDbFiles'] = value;
	}

	public get selectedBackupSets(): string[] {
		return this.options['selectedBackupSets'];
	}

	public set selectedBackupSets(value: string[]) {
		this.options['selectedBackupSets'] = value;
	}
}