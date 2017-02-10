/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

export class ConnectionDialogModel {
	constructor(public serverName: string,
				public databaseName: string,
				public userName: string,
				public password: string) {
				}

	public toString(): string {
		return `${this.serverName}, ${this.databaseName}, ${this.userName}`;
	}
}