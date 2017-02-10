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


export const SERVICE_ID = 'registeredServersService';

export const IRegisteredServersService = createDecorator<IRegisteredServersService>(SERVICE_ID);

export interface RegisteredServersEvents {
	onAddRegisteredServer(connection: vscode.ConnectionInfo): void;

	onConnect(connection: vscode.ConnectionInfo): void;
}

export interface IRegisteredServersService {
	_serviceBrand: any;

	addEventListener(handle: number, events: RegisteredServersEvents): IDisposable;

	newConnection();

	addRegisteredServer(connection: vscode.ConnectionInfo): void;


	// temporary interface entries for testing purposes
	open(connection: vscode.ConnectionInfo, sideByside: boolean): TPromise<any>;

	onConnectionSwitched: Event<vscode.ConnectionInfo>;
}

export const IConnectionDialogService = createDecorator<IConnectionDialogService>('connectionDialogService');
export interface IConnectionDialogService {
	_serviceBrand: any;
	open(registeredServersService: IRegisteredServersService);
}

