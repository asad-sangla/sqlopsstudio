/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import Event from 'vs/base/common/event';
import data = require('data');
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
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
	onConnect: Event<void>;
	onConnectionChanged: Event<IConnectionChangedParams>;

	newConnection(params?: INewConnectionParams, model?: IConnectionProfile): void;

	addConnectionProfile(connection: IConnectionProfile): Promise<boolean>;

	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;

	onConnectionChangedNotification(handle: number, changedConnInfo: data.ChangedConnectionInfo);

	getConnectionGroups(): ConnectionProfileGroup[];

	getRecentConnections(): ConnectionProfile[];

	getActiveConnections(): data.ConnectionInfo[];

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void>;

	changeGroupIdForConnection(source: IConnectionProfile, targetGroupName: string): Promise<void>;

	getAdvancedProperties(): data.ConnectionOption[];

	connectEditor(editor: IConnectableInput, runQueryOnCompletion: boolean, connection: ConnectionProfile | IConnectionProfile): Promise<boolean>;

	connectProfile(connection: ConnectionProfile): Promise<boolean>;

	isConnected(fileUri: string): boolean;

	disconnectEditor(owner: IConnectableInput, force?: boolean): Promise<boolean>;

	addSavedPassword(connectionProfile: IConnectionProfile): Promise<IConnectionProfile>;

	listDatabases(connectionUri: string): Thenable<data.ListDatabasesResult>;

	/**
	 * Register a connection provider
	 */
	registerProvider(providerId: string, provider: data.ConnectionProvider): void;

	getConnectionProfile(fileUri: string): IConnectionProfile;

	/**
	 * Cancels the connection
	 */
	cancelConnection(connection: IConnectionProfile): Thenable<boolean>;

	/**
	 * Cancels the connection for the editor
	 */
	cancelEditorConnection(owner: IConnectableInput): Thenable<boolean>;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model: IConnectionProfile): TPromise<void>;
}

export const IErrorMessageService = createDecorator<IErrorMessageService>('errorMessageService');
export interface IErrorMessageService {
	_serviceBrand: any;
	showDialog(container: HTMLElement, severity: Severity, headerTitle: string, message: string): void;
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
	input?: IConnectableInput;
	runQueryOnCompletion?: boolean;
}

export interface IConnectableInput {
	uri: string;
	onConnectStart(): void;
	onConnectReject(error?: string): void;
	onConnectSuccess(runQueryOnCompletion: boolean): void;
	onDisconnect(): void;
}

export class DashboardParameterWrapper {
	public ownerUri: string;

	public connection: IConnectionProfile;
}

export enum ConnectionType {
	default = 0,
	queryEditor = 1
}

export enum MetadataType {
	Table = 0,
	View = 1,
	SProc = 2,
	Function = 3
}

export interface IConnectionChangedParams {
	connectionUri: string;
	connectionInfo: IConnectionProfile;
}
