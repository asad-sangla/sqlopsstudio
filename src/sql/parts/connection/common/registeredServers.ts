/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IViewlet } from 'vs/workbench/common/viewlet';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import Event from 'vs/base/common/event';

export const VIEWLET_ID = 'workbench.view.connections';

export interface IConnectionsViewlet extends IViewlet {
	search(text: string): void;
}

export interface IConnection {
	serverName: string;

	databaseName: string;

	userName: string;

	password: string;
}

export const SERVICE_ID = 'registeredServersService';

export const IRegisteredServersService = createDecorator<IRegisteredServersService>(SERVICE_ID);

export interface RegisteredServersEvents {
	onConnectionSwitched(connection: IConnection): void;
}

export interface IRegisteredServersService {
	_serviceBrand: any;

	newConnection();

	open(connection: IConnection, sideByside: boolean): TPromise<any>;

	onConnectionSwitched: Event<IConnection>;

	registerConnectionProvider(handle: number, events: RegisteredServersEvents): IDisposable;

	getConnectionProviders(): RegisteredServersEvents[];

	addRegisteredServer(connection: IConnection): void;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	open();
}

