/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IConnectionManagementService, ConnectionManagementEvents, IConnectionDialogService } from 'sql/parts/connection/common/connectionManagement';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { IStatusbarService } from 'vs/platform/statusbar/common/statusbar';
import { Memento } from 'vs/workbench/common/memento';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ConnectionStore } from './connectionStore';
import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { ConnectionManagementInfo } from './connectionManagementInfo';
import Utils = require('./utils');
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import { ICredentialsService } from 'sql/parts/credentials/credentialsService';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { DashboardInput } from 'sql/parts/connection/dashboard/dashboardInput';
import * as data from 'data';
import * as ConnectionContracts from 'sql/parts/connection/node/connection';
import { IQuickOpenService } from 'vs/platform/quickOpen/common/quickOpen';

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
		@ICredentialsService private _credentialsService: ICredentialsService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IQuickOpenService private quickOpenService: IQuickOpenService
	) {

		this.connectionMemento = new Memento('ConnectionManagement');

		this._connectionStore = new ConnectionStore(_storageService, this.connectionMemento,
			_configurationEditService, this._workspaceConfigurationService, this._credentialsService);
		this._connections = {};
	}

	public newConnection(): void {
		this._connectionDialogService.showDialog(this);
	}

	public addConnectionProfile(connection: IConnectionProfile): Promise<boolean> {
		let uri = this.getDocumentUri(connection);

		return new Promise<boolean>((resolve, reject) => {
			this._statusService.setStatusMessage('Connecting...');
			return this.connect(uri, connection).then(connected => {
				if (connected) {
					let connectionInfo = this._connections[uri];
					this.saveToSettings(connectionInfo.connectionProfile).then(value => {
						if (value) {
							for (var key in this._serverEvents) {
								this._serverEvents[key].onAddConnectionProfile(uri, connectionInfo.connectionProfile);
							}
						}
					});
					this.showDashboard(connection);
				}
				resolve(connected);
			}).catch(err => {
				reject(err);
			});
		});
	}

	private showDashboard(connection: IConnectionProfile): Promise<boolean> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			let dashboardInput: DashboardInput = self._instantiationService.createInstance(DashboardInput, connection);
			self._editorService.openEditor(dashboardInput, null, false);
			resolve(true);
		});
	}

	public getConnections(): ConnectionProfileGroup[] {
		return this._connectionStore.getConnectionProfileGroups();
	}

	public getRecentConnections(): data.ConnectionInfo[] {
		return this._connectionStore.getRecentlyUsedConnections();
	}

	public getAdvancedProperties(): data.ConnectionOption[] {
		let capabilities = this._capabilitiesService.getCapabilities();
		if (capabilities !== undefined && capabilities.length > 0) {
			// just grab the first registered provider for now, this needs to change
			// to lookup based on currently select provider
			let providerCapabilities = capabilities[0];
			if (!!providerCapabilities.connectionProvider) {
				return providerCapabilities.connectionProvider.options;
			}
		}

		return undefined;
	}

	// Request Senders
	// TODO: Request Handlers Mapping to prevent sending request to all handlers
	private sendConnectRequest(connection: data.ConnectionInfo, uri: string): void {
		for (var key in this._serverEvents) {
			this._serverEvents[key].onConnect(uri, connection);
		}
	}

	private sendDisconnectRequest(uri: string): Thenable<boolean> {
		// TODO: send onDisconnect event
		return new Promise(() => true);
	}

	private sendCancelRequest(uri: string): Thenable<boolean> {
		// TODO: send onCancelRequest event
		return new Promise(() => true);
	}

	private getDocumentUri(connection: data.ConnectionInfo): string {
		let uri = this.getActiveEditorUri();
		if (!uri) {
			uri = 'connection://' + connection.serverName + ':' + connection.databaseName;
		}

		return uri;
	}

	private getActiveEditorUri(): string {
		try {
			let activeEditor = this._editorService.getActiveEditor();
			if (activeEditor !== undefined) {
				return this.getActiveEditorInputResource();
			}
		} catch (e) {
			return undefined;
		}
	}

	private saveToSettings(connection: IConnectionProfile): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this._connectionStore.saveProfile(connection).then(result => {
				return resolve(true);
			});
		});

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

	public onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {
		const self = this;
		let connection = this._connections[connectionInfoSummary.ownerUri];
		connection.serviceTimer.end();
		connection.connecting = false;

		let mruConnection: IConnectionProfile = <any>{};

		if (Utils.isNotEmpty(connectionInfoSummary.connectionId)) {
			connection.connectHandler(true);
			mruConnection = connection.connectionProfile;
		} else {
			connection.connectHandler(false, connectionInfoSummary.messages);
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

	public shutdown(): void {
		this.connectionMemento.saveMemento();
	}

	public addEventListener(handle: number, serverEvents: ConnectionManagementEvents): IDisposable {
		this._providers.push(serverEvents);

		this._serverEvents[handle] = serverEvents;

		return {
			dispose: () => {
			}
		};
	}

	private getActiveEditorInputResource(): string {
		const input = this._editorService.getActiveEditorInput();
		if (input &&
			(input instanceof FileEditorInput
				|| input instanceof UntitledEditorInput
				|| input instanceof QueryInput)) {
			return input.getResource().toString();
		}

		return null;
	}

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		return this._connectionStore.changeGroupIdForConnectionGroup(source, target);
	}

	public changeGroupIdForConnection(source: IConnectionProfile, targetGroupId: string): Promise<void> {
		return this._connectionStore.changeGroupIdForConnection(source, targetGroupId);
	}

	/* Live connection related functions */

	// Connect an open URI to a connection profile
	public connect(uri: string, connection: IConnectionProfile): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			let connectionInfo: ConnectionManagementInfo = new ConnectionManagementInfo();
			connectionInfo.extensionTimer = new Utils.Timer();
			connectionInfo.intelliSenseTimer = new Utils.Timer();
			connectionInfo.connectionProfile = connection;
			connectionInfo.connecting = true;
			self._connections[uri] = connectionInfo;

			// Setup the handler for the connection complete notification to call
			connectionInfo.connectHandler = ((connectResult, error) => {
				if (error) {
					reject(error);
				} else {
					resolve(connectResult); // on connection complete called here?
				}
			});

			connectionInfo.serviceTimer = new Utils.Timer();

			// send connection request
			self.sendConnectRequest(connection, uri);
		});
	}

	// Disconnect a URI from its current connection
	public disconnect(fileUri: string): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			if (self.isConnected(fileUri)) {
				resolve(self.doDisconnect(fileUri));
			} else if (self.isConnecting(fileUri)) {
				// Prompt the user to cancel connecting
				self.shouldCancelConnect(fileUri).then((result) => {
					if (result) {
						self.doCancelConnect(fileUri);
					}
					resolve(true);
				});
			} else {
				resolve(true);
			}
		});
    }

	// Ask user if they are sure they want to cancel connection request
	private shouldCancelConnect(fileUri: string): Thenable<boolean> {
		const self = this;

        // Double check if the user actually wants to cancel their connection request
		return new Promise<boolean>((resolve, reject) => {
			// Setup our cancellation choices
			let choices: {key, value}[] = [
				{key: nls.localize('yes', 'Yes'), value: true},
				{key: nls.localize('no', 'No'), value: false}
			];

			self.quickOpenService.pick(choices.map(x => x.key), {placeHolder: nls.localize('cancelConnetionConfirmation','Are you sure you want to cancel this connection?'), ignoreFocusLost: true}).then((choice) => {
				let confirm = choices.find(x => x.key === choice);
				resolve(confirm && confirm.value);
			});
		});
    }

	private doDisconnect(fileUri: string) {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			let disconnectParams = new ConnectionContracts.DisconnectParams();
			disconnectParams.ownerUri = fileUri;

			// Send a disconnection request for the input URI
			self.sendDisconnectRequest(fileUri).then((result) => {
				// If the request was sent
				if (result) {
					delete self._connections[fileUri];
					// TODO: show diconnection in status statusview
					// self.statusView.notConnected(fileUri);

					// TODO: send telemetry events
					// Telemetry.sendTelemetryEvent('DatabaseDisconnected');
					resolve(true);
				} else {
					resolve(false);
				}
			});
		});
	}

	private doCancelConnect(fileUri: string): Thenable<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			// Check if we are still conecting after user input
			if (self.isConnecting(fileUri)) {
				// Create a new set of cancel connection params with our file URI
				let cancelParams: ConnectionContracts.CancelConnectParams = new ConnectionContracts.CancelConnectParams();
				cancelParams.ownerUri = fileUri;

				delete self._connections[fileUri];
				// Send connection cancellation request
				resolve(self.sendCancelRequest(fileUri));
			} else {
				// If we are not connecting anymore let disconnect handle the next steps
				resolve(self.disconnect(fileUri));
			}
		});
    }

	// Is a certain file URI connected?
	private isConnected(fileUri: string): boolean {
        return (fileUri in this._connections && this._connections[fileUri].connectionId && Utils.isNotEmpty(this._connections[fileUri].connectionId));
    }

	// Is a certain file URI currently connecting
	private isConnecting(fileUri: string): boolean {
        return (fileUri in this._connections && this._connections[fileUri].connecting);
    }
}
