/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import Event from 'vs/base/common/event';
import data = require('data');
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
	onAddConnectionProfile(uri: string, connection: data.ConnectionInfo): void;

	onDeleteConnectionProfile(uri: string, connection: data.ConnectionInfo): void;

	onConnect(connectionUri: string, connection: data.ConnectionInfo): Thenable<boolean>;
}

export interface IConnectionManagementService {
	_serviceBrand: any;

	addEventListener(handle: number, events: ConnectionManagementEvents): IDisposable;

	newConnection(): void;

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>;

	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;

	getConnections(): ConnectionProfileGroup[];

	getRecentConnections(): data.ConnectionInfo[];

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void>;

	changeGroupIdForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void>;

	getAdvancedProperties(): data.ConnectionOption[];

	connect(fileUri: string, connection: ConnectionProfile): Promise<boolean>;

	disconnect(fileUri: string): Promise<boolean>;
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
