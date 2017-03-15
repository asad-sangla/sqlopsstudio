/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

// SQL added extension host types
export enum ConnectionOptionType {
	string = 0,
	multistring = 1,
	password = 2,
	number = 3,
	category = 4,
	boolean = 5
}

export enum ConnectionOptionSpecialType {
	serverName = 0,
	databaseName = 1,
	authType = 2,
	userName = 3,
	password = 4
}


export enum MetadataType
{
	Table = 0,
	View = 1,
	SProc = 2,
	Function = 3
}
