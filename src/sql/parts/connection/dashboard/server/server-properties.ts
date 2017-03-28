/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class ServerProperties {
	key: string;
	value: string;

	constructor(key: string, value: string){
		this.key = key;
		this.value = value;
	}
}
