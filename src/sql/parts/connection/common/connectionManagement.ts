/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import Event from 'vs/base/common/event';
import data = require('data');
import { IConnectionProfileGroup, ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import Severity from 'vs/base/common/severity';
import { ISelectionData } from 'data';
import { ConnectionManagementInfo } from './connectionManagementInfo';

export const VIEWLET_ID = 'workbench.view.connections';

export interface IConnectionsViewlet extends IViewlet {
	search(text: string): void;
}

export interface IConnectionCompletionOptions {
	saveToSettings: boolean;
	showDashboard: boolean;
	params: INewConnectionParams;
	showConnectionDialogOnError: boolean;
}

export interface IConnectionResult {
	connected: boolean;
	error: string;
}

export interface IConnectionCallbacks {
	onConnectStart(): void;
	onConnectReject(error?: string): void;
	onConnectSuccess(params?: INewConnectionParams): void;
	onDisconnect(): void;
}

export const SERVICE_ID = 'connectionManagementService';

export const IConnectionManagementService = createDecorator<IConnectionManagementService>(SERVICE_ID);

export interface IConnectionManagementService {
	_serviceBrand: any;

	// Event Emitters
	onAddConnectionProfile: Event<void>;
	onDeleteConnectionProfile: Event<void>;
	onConnect: Event<void>;
	onDisconnect: Event<IConnectionParams>;
	onConnectionChanged: Event<IConnectionChangedParams>;

	/**
	 * Opens the connection dialog to create new connection
	 */
	showConnectionDialog(params?: INewConnectionParams, model?: IConnectionProfile, error?: string): Promise<void>;

	/**
	 * Load the password and opens a new connection
	 */
	connect(connection: IConnectionProfile, uri: string, options?: IConnectionCompletionOptions, callbacks?: IConnectionCallbacks): Promise<IConnectionResult>;

	/**
	 * Opens a new connection and save the profile in settings
	 */
	connectAndSaveProfile(connection: IConnectionProfile, uri: string, options?: IConnectionCompletionOptions, callbacks?: IConnectionCallbacks): Promise<IConnectionResult>;

	/**
	 * Adds the successful connection to MRU and send the connection error back to the connection handler for failed connections
	 */
	onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;

	onConnectionChangedNotification(handle: number, changedConnInfo: data.ChangedConnectionInfo);

	getConnectionGroups(): ConnectionProfileGroup[];

	getRecentConnections(): ConnectionProfile[];

	getUnsavedConnections(): ConnectionProfile[];

	getActiveConnections(): data.ConnectionInfo[];

	changeGroupIdForConnectionGroup(source: IConnectionProfileGroup, target: IConnectionProfileGroup): Promise<void>;

	changeGroupIdForConnection(source: ConnectionProfile, targetGroupName: string): Promise<void>;

	deleteConnection(connection: ConnectionProfile): Promise<boolean>;

	deleteConnectionGroup(group: ConnectionProfileGroup): Promise<boolean>;

	getAdvancedProperties(): data.ConnectionOption[];

	getConnectionId(connectionProfile: ConnectionProfile): string;

	isConnected(fileUri: string): boolean;

	/**
	 * Returns true if the connection profile is connected
	 */
	isProfileConnected(connectionProfile: IConnectionProfile): boolean;

	isRecent(connectionProfile: ConnectionProfile): boolean;

	isConnected(fileUri: string, connectionProfile?: ConnectionProfile): boolean;

	disconnectEditor(owner: IConnectableInput, force?: boolean): Promise<boolean>;

	disconnectProfile(connection: ConnectionProfile): Promise<boolean>;

	addSavedPassword(connectionProfile: IConnectionProfile): Promise<IConnectionProfile>;

	listDatabases(connectionUri: string): Thenable<data.ListDatabasesResult>;

	/**
	 * Register a connection provider
	 */
	registerProvider(providerId: string, provider: data.ConnectionProvider): void;

	getConnectionProfile(fileUri: string): IConnectionProfile;

	getConnectionInfo(fileUri: string): ConnectionManagementInfo;

	/**
	 * Cancels the connection
	 */
	cancelConnection(connection: IConnectionProfile): Thenable<boolean>;

	/**
	 * Changes the database for an active connection
	 */
	changeDatabase(connectionUri: string, databaseName: string): Thenable<boolean>;

	/**
	 * Cancels the connection for the editor
	 */
	cancelEditorConnection(owner: IConnectableInput): Thenable<boolean>;

	showDashboard(uri: string, connection: ConnectionManagementInfo): Promise<boolean>;

	closeDashboard(uri: string): void;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model: IConnectionProfile, error?: string): TPromise<void>;
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
	querySelection?: ISelectionData;
}

export interface IConnectableInput {
	uri: string;
	onConnectStart(): void;
	onConnectReject(error?: string): void;
	onConnectSuccess(params?: INewConnectionParams): void;
	onDisconnect(): void;
}

export enum ConnectionType {
	default = 0,
	editor = 1
}

export enum MetadataType {
	Table = 0,
	View = 1,
	SProc = 2,
	Function = 3
}
export interface IConnectionParams {
	connectionUri: string;
}

export interface IConnectionChangedParams extends IConnectionParams {
	connectionInfo: IConnectionProfile;
}
