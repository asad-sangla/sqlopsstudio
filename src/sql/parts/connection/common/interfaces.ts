/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import data = require('data');

export enum AuthenticationTypes {
	Integrated = 1,
	SqlLogin = 2,
	ActiveDirectoryUniversal = 3
}

// A Connection Profile contains all the properties of connection credentials, with additional
// optional name and details on whether password should be saved
export interface IConnectionProfile extends data.ConnectionInfo {
	serverName: string;
	databaseName: string;
	userName: string;
	password: string;
	authenticationType: string;
	savePassword: boolean;
	groupFullName: string;
	groupId: string;
	getOptionsKey(): string;
	providerName: string;
	saveProfile: boolean;
	id: string;
};

export interface IConnectionProfileStore {
	options: {};
	groupId: string;
	providerName: string;
	savePassword: boolean;
	id: string;
};

export enum CredentialsQuickPickItemType {
	Profile,
	Mru,
	NewConnection
};
