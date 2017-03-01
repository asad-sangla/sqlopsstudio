/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import nls = require('vs/nls');
import { TPromise } from 'vs/base/common/winjs.base';
import URI from 'vs/base/common/uri';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IConnectionManagementService, ConnectionManagementEvents, IConnectionDialogService, ConnectionPropertyType } from 'sql/parts/connection/common/connectionManagement';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { IStatusbarService } from 'vs/platform/statusbar/common/statusbar';
import { Memento } from 'vs/workbench/common/memento';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import * as vscode from 'vscode';
import { ConnectionStore } from './connectionStore';
import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { ConnectionManagementInfo } from './connectionManagementInfo';
import Utils = require('./utils');
import { ICredentialsService } from 'sql/parts/credentials/credentialsService'

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: ConnectionManagementEvents[] = [];

	private _serverEvents: { [handle: number]: ConnectionManagementEvents; } = Object.create(null);

    private _connectionStore: ConnectionStore;

	private connectionMemento: Memento;

	private _connections: { [fileUri: string]: ConnectionManagementInfo };


	constructor(
		@IConnectionDialogService private _connectionDialogService: IConnectionDialogService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IStatusbarService private _statusService: IStatusbarService,
		@IWorkspaceContextService private _contextService: IWorkspaceContextService,
		@IStorageService private _storageService: IStorageService,
		@ITelemetryService private _telemetryService: ITelemetryService,
		@IConfigurationEditingService private _configurationEditService: IConfigurationEditingService,
		@IWorkspaceConfigurationService private _workspaceConfigurationService: IWorkspaceConfigurationService,
		@ICredentialsService private _credentialsService: ICredentialsService
	) {

		this.connectionMemento = new Memento('ConnectionManagement');

		this._connectionStore = new ConnectionStore(_storageService, this.connectionMemento,
		_configurationEditService, this._workspaceConfigurationService);
		this._connections = {};
	}


	public newConnection(): void {
		this._credentialsService.saveCredential('id', 'password1').then(r => {
			this._credentialsService.readCredential('id').then(cr => {
				this._credentialsService.deleteCredential('id');
			});
		});

		this._connectionDialogService.showDialog(this);
	}

	public addConnectionProfile(connection: IConnectionProfile): Promise<boolean> {
		let uri = this.getDocumentUri(connection);

		return new Promise<boolean>((resolve, reject) => {
		this._statusService.setStatusMessage('Connecting...');
			return this.connect(uri, connection).then(connected => {
				if(connected) {
					let connectionInfo = this._connections[uri];
					this.saveToSettings(connectionInfo.connectionProfile);
				}
				resolve(connected);
			}).catch(err => {
				reject(err);
			});
		});
	}

	public getAllConnections(): ConnectionProfileGroup[] {
		return this._connectionStore.getConnectionProfileGroups();
	}

	private connect(uri: string, connection: IConnectionProfile): Promise<boolean> {
			const self = this;

			return new Promise<boolean>((resolve, reject) => {
				let connectionInfo: ConnectionManagementInfo = new ConnectionManagementInfo();
				connectionInfo.extensionTimer = new Utils.Timer();
				connectionInfo.intelliSenseTimer = new Utils.Timer();
				connectionInfo.connectionProfile = connection;
				connectionInfo.connecting = true;
				this._connections[uri] = connectionInfo;

				// Setup the handler for the connection complete notification to call
				connectionInfo.connectHandler = ((connectResult, error) => {
					if (error) {
						reject(error);
					} else {
						resolve(connectResult);
					}
				});

				connectionInfo.serviceTimer = new Utils.Timer();

				// send connection request
				self.sentConnectRequest(connection, uri);
        });
	}

	public getAdvancedProperties(): vscode.ConnectionProperty[] {
		var connectionProperties : vscode.ConnectionProperty[] = [
			{
			propertyName: 'Initial Catalog',
			propertyType: ConnectionPropertyType.string,
			propertyOptions: null,
			propertyValue: 'db1'
			},
			{
			propertyName: "Application Intent",
			propertyType: ConnectionPropertyType.options,
			propertyOptions: ['ReadWrite', 'ReadOnly'],
			propertyValue: 0
			},
			{
			propertyName: "Asynchronous Processing",
			propertyType: ConnectionPropertyType.boolean,
			propertyOptions: null,
			propertyValue: false
			},
			{
			propertyName: 'Connect Timeout',
			propertyType: ConnectionPropertyType.number,
			propertyOptions: null,
			propertyValue: 100
			},
			{
			propertyName: 'Current Language',
			propertyType: ConnectionPropertyType.string,
			propertyOptions: null,
			propertyValue: null
			},
			{
			propertyName: "Column Encrytion Setting",
			propertyType: ConnectionPropertyType.options,
			propertyOptions: ['Disable', 'Enabled'],
			propertyValue: 0
			},
			{
			propertyName: "Encrypt",
			propertyType: ConnectionPropertyType.boolean,
			propertyOptions: null,
			propertyValue: true
			},
			{
			propertyName: "Persist Security Info",
			propertyType: ConnectionPropertyType.boolean,
			propertyOptions: null,
			propertyValue: false
			},
			{
			propertyName: "Trust Server Certificate",
			propertyType: ConnectionPropertyType.boolean,
			propertyOptions: null,
			propertyValue: false
			},
			{
			propertyName: 'Attached DB File Name',
			propertyType: ConnectionPropertyType.string,
			propertyOptions: null,
			propertyValue: null
			},
			{
			propertyName: 'Context Connection',
			propertyType: ConnectionPropertyType.boolean,
			propertyOptions: null,
			propertyValue: true
			}
		];
		return connectionProperties;
	}

	private sentConnectRequest(connection: vscode.ConnectionInfo, uri: string): void {
		for (var key in this._serverEvents) {
			this._serverEvents[key].onConnect(uri, connection);
		}
	}

	private getDocumentUri(connection: vscode.ConnectionInfo): string {
		let uri = this.getActiveEditorUri();
		if(uri === undefined) {
			uri = 'connection://' + connection.serverName + ':' + connection.databaseName;
		}

		return uri;
	}

	private getActiveEditorUri(): string {
		let uri: string = undefined;
		let activeEditor = this._editorService.getActiveEditor();
		if (activeEditor !== undefined) {
			uri = this.getActiveEditorInputResource().toString();
		}
		return uri;
	}

	private saveToSettings(connection: IConnectionProfile): boolean {
		this._connectionStore.saveProfile(connection);
		return true;
	}

	private tryAddMruConnection(connectionManagementInfo: ConnectionManagementInfo, newConnection: IConnectionProfile): void {
        if (newConnection) {

            this._connectionStore.addRecentlyUsed(newConnection)
			  .then(() => {
                connectionManagementInfo.connectHandler(true);
            }, err => {
                connectionManagementInfo.connectHandler(false, err);
            });
        } else {
            connectionManagementInfo.connectHandler(false);
        }
    }

	public onConnectionComplete(handle: number, connectionInfoSummary: vscode.ConnectionInfoSummary): void {
		const self = this;
		let connection = this._connections[connectionInfoSummary.ownerUri];
        connection.serviceTimer.end();
        connection.connecting = false;

        let mruConnection: IConnectionProfile = <any>{};

        if (Utils.isNotEmpty(connectionInfoSummary.connectionId)) {
            connection.connectHandler(true);
            mruConnection = connection.connectionProfile;
        } else {
            connection.connectHandler(false);
            mruConnection = undefined;
        }

        self.tryAddMruConnection(connection, mruConnection);
		this._statusService.setStatusMessage('Updating IntelliSense cache');
	}



	public onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._statusService.setStatusMessage('Connection Complete ' + connectionUri);
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public addEventListener(handle: number, serverEvents: ConnectionManagementEvents): IDisposable {
		this._providers.push(serverEvents);

		this._serverEvents[handle] = serverEvents;

		return {
			dispose: () => {
			}
		};
	}

	private getActiveEditorInputResource(): URI {
		const input = this._editorService.getActiveEditorInput();
		if (input && (input instanceof FileEditorInput || input instanceof UntitledEditorInput)) {
			return input.getResource();
		}

		return null;
	}
}
