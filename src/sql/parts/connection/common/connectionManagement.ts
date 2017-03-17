/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import Event from 'vs/base/common/event';
import data = require('data');
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import Severity from 'vs/base/common/severity';

export const VIEWLET_ID = 'workbench.view.connections';

export interface IConnectionsViewlet extends IViewlet {
	search(text: string): void;
}

export const SERVICE_ID = 'connectionManagementService';

export const IConnectionManagementService = createDecorator<IConnectionManagementService>(SERVICE_ID);

export interface IConnectionManagementService {
	_serviceBrand: any;

	// Event Emitters
	onAddConnectionProfile: Event<void>;
	onDeleteConnectionProfile: Event<void>;

	newConnection(params?: INewConnectionParams, model?: IConnectionProfile): void;

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>;

	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;

	getConnectionGroups(): ConnectionProfileGroup[];

	getRecentConnections(): ConnectionProfile[];

	getActiveConnections(): data.ConnectionInfo[];

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void>;

	changeGroupIdForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void>;

	getAdvancedProperties(): data.ConnectionOption[];

	connectEditor(editor: IConnectableEditor, uri: string, runQueryOnCompletion: boolean, connection: ConnectionProfile | IConnectionProfile): Promise<boolean>;

	connectProfile(connection: ConnectionProfile): Promise<boolean>;

	isConnected(fileUri: string): boolean;

	disconnectEditor(editor: IConnectableEditor, uri: string, force?: boolean): Promise<boolean>;

	/**
	 * Register a connection provider
	 */
	registerProvider(providerId: string, provider: data.ConnectionProvider): void;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model: IConnectionProfile): TPromise<void>;
}

export const IErrorMessageService = createDecorator<IErrorMessageService>('errorMessageService');
export interface IErrorMessageService {
	_serviceBrand: any;
	showDialog(container: HTMLElement,  severity: Severity, headerTitle: string, message: string): void;
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

export interface INewConnectionParams {
	connectionType: ConnectionType;
	editor?: IConnectableEditor;
	uri?: string;
	runQueryOnCompletion?: boolean;
}

export interface IConnectableEditorParams {
	uri: string;
	editor: IConnectableEditor;
}

export interface IConnectableEditor {
	uri: string;
	onConnectStart(): void;
	onConnectReject(): void;
	onConnectSuccess(runQueryOnCompletion: boolean): void;
	onDisconnect(): void;
}

export enum ConnectionType {
	default = 0,
	queryEditor = 1
}

export enum MetadataType
{
	Table = 0,
	View = 1,
	SProc = 2,
	Function = 3
}
