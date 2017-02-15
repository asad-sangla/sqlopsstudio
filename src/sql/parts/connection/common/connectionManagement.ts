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

export const VIEWLET_ID = 'workbench.view.connections';

export interface IConnectionsViewlet extends IViewlet {
	search(text: string): void;
}

export interface IConnection {
	name: string;
	displayName: string;
}

export const SERVICE_ID = 'connectionManagementService';

export const IConnectionManagementService = createDecorator<IConnectionManagementService>(SERVICE_ID);

export interface ConnectionManagementEvents {
	onAddConnectionProfile(connection: vscode.ConnectionInfo): void;

	onConnect(connectionUri: string, connection: vscode.ConnectionInfo): void;
}

export interface IConnectionManagementService {
	_serviceBrand: any;

	addEventListener(handle: number, events: ConnectionManagementEvents): IDisposable;

	newConnection();

	addConnectionProfile(connection: vscode.ConnectionInfo): void;

	onConnectionComplete(handle: number, connectionUri: string): void;

	onIntelliSenseCacheComplete(handle: number, connectionUri: string): void;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	showDialog(connectionManagementService: IConnectionManagementService): TPromise<void>;
}
