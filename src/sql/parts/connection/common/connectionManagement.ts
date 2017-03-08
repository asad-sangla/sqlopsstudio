/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import Event from 'vs/base/common/event';
import vscode = require('vscode');
import { IConnectionProfileGroup, ConnectionProfileGroup } from '../node/connectionProfileGroup';
import { ConnectionProfile } from '../node/connectionProfile';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

export const VIEWLET_ID = 'workbench.view.connections';

export interface IConnectionsViewlet extends IViewlet {
	search(text: string): void;
}

export const SERVICE_ID = 'connectionManagementService';

export const IConnectionManagementService = createDecorator<IConnectionManagementService>(SERVICE_ID);

export interface ConnectionManagementEvents {
	onAddConnectionProfile(uri: string, connection: vscode.ConnectionInfo): void;

	onDeleteConnectionProfile(uri: string, connection: vscode.ConnectionInfo): void;

	onConnect(connectionUri: string, connection: vscode.ConnectionInfo): void;
}

export interface IConnectionManagementService {
	_serviceBrand: any;

	addEventListener(handle: number, events: ConnectionManagementEvents): IDisposable;

	newConnection();

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>;

	onConnectionComplete(handle: number, connectionInfoSummary: vscode.ConnectionInfoSummary): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;

	getConnections(): ConnectionProfileGroup[];

	getRecentConnections(): vscode.ConnectionInfo[];

	updateGroups(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void>;

	changeGroupNameForGroup(sourceGroupName: string, targetGroupName: string): Promise<void>;

	changeGroupNameForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void>;

	getAdvancedProperties(): vscode.ConnectionOption[];
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	showDialog(connectionManagementService: IConnectionManagementService): TPromise<void>;
}

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
