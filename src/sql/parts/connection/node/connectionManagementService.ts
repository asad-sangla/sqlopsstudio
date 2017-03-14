/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IConnectionManagementService, IConnectionDialogService } from 'sql/parts/connection/common/connectionManagement';
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
import Event, { Emitter } from 'vs/base/common/event';

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ConnectionProvider; } = Object.create(null);

	private _connectionStore: ConnectionStore;

	private connectionMemento: Memento;

	private _connections: { [fileUri: string]: ConnectionManagementInfo };

	private _onAddConnectionProfile: Emitter<void>;
	private _onDeleteConnectionProfile: Emitter<void>;

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

		// Setting up our event emitters
		this._onAddConnectionProfile = new Emitter<void>();
		this._onDeleteConnectionProfile = new Emitter<void>();

		this.disposables.push(this._onAddConnectionProfile);
		this.disposables.push(this._onDeleteConnectionProfile);
	}

	// Event Emitters
	public get onAddConnectionProfile(): Event<void> {
		return this._onAddConnectionProfile.event;
	}

	public get onDeleteConnectionProfile(): Event<void> {
		return this._onDeleteConnectionProfile.event;
	}

	// Connection Provider Registration
	public registerProvider(providerId: string, provider: data.ConnectionProvider): void {
		this._providers[providerId] = provider;
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
							this._onAddConnectionProfile.fire();
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

	public getConnectionGroups(): ConnectionProfileGroup[] {
		return this._connectionStore.getConnectionProfileGroups();
	}

	public getRecentConnections(): data.ConnectionInfo[] {
		return this._connectionStore.getRecentlyUsedConnections();
	}

	public getActiveConnections(): data.ConnectionInfo[] {
		return this._connectionStore.getActiveConnections();
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
	// TODO: Request Handlers Mapping to prevent sending request to all providers
	private sendConnectRequest(connection: data.ConnectionInfo, uri: string): Thenable<boolean> {
		return new Promise((resolve, reject) => {
			for (var key in this._providers) {
				this._providers[key].connect(uri, connection);
			}
			resolve(true);
		});
	}

	private sendDisconnectRequest(uri: string): Thenable<boolean> {
		return new Promise((resolve, reject) => {
			for (var key in this._providers) {
				this._providers[key].disconnect(uri);
			}
			resolve(true);
		});
	}

	private sendCancelRequest(uri: string): Thenable<boolean> {
		return new Promise((resolve, reject) => {
			for (var key in this._providers) {
				this._providers[key].cancelConnect(uri);
			}
			resolve(true);
		});
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

	/**
	 * Add a connection to the recent connections list.
	 */
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

	/**
	 * Add a connection to the active connections list.
	 */
	private tryAddActiveConnection(connectionManagementInfo: ConnectionManagementInfo, newConnection: IConnectionProfile): void {
		if (newConnection) {
			this._connectionStore.addActiveConnection(newConnection)
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
		connection.connectionId = connectionInfoSummary.connectionId;

		let activeConnection: IConnectionProfile = <any>{};

		if (Utils.isNotEmpty(connectionInfoSummary.connectionId)) {
			connection.connectHandler(true);
			activeConnection = connection.connectionProfile;
		} else {
			connection.connectHandler(false, connectionInfoSummary.messages);
			activeConnection = undefined;
		}

		self.tryAddActiveConnection(connection, activeConnection);
		this._statusService.setStatusMessage('Updating IntelliSense cache');
	}



	public onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._statusService.setStatusMessage('Connection Complete ' + connectionUri);
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public shutdown(): void {
		this._connectionStore.saveActiveConnectionsToRecent();
		this.connectionMemento.saveMemento();
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

	// Connect a URI from its current connection
	public connectEditor(uri: string, connectionProfile: ConnectionProfile): Promise<boolean> {
		let connection: IConnectionProfile = {
			serverName: connectionProfile.serverName,
			databaseName: connectionProfile.databaseName,
			userName: connectionProfile.userName,
			password: connectionProfile.password,
			authenticationType: connectionProfile.authenticationType,
			groupId: connectionProfile.groupId,
			groupName: connectionProfile.groupName,
			savePassword: connectionProfile.savePassword
		};

		// Retrieve saved password if needed
		return new Promise<boolean>((resolve, reject) => {
			this._connectionStore.addSavedPassword(connection).then(newConnection => {
				return this.connect(uri, newConnection).then(status => {
					// Status tells use if the connection attempt was successfull or not
					resolve(status);
				});
			});
		});
	}

	// Disconnect a URI from its current connection
	public disconnectEditor(fileUri: string, force: boolean = false): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			if (self.isConnected(fileUri)) {
				resolve(self.doDisconnect(fileUri));
			} else if (self.isConnecting(fileUri)) {
				// Prompt the user to cancel connecting
				if (!force) {
					self.shouldCancelConnect(fileUri).then((result) => {
						if (result) {
							resolve(self.doCancelConnect(fileUri));
						}
						resolve(false);
					});
				} else {
					resolve(self.doCancelConnect(fileUri));
				}

			};

			// resolve true if already disconnected
			resolve(true);
		});
    }


	/**
	 * Functions to handle the connecting lifecycle
	 */

	// Connect an open URI to a connection profile
	private connect(uri: string, connection: IConnectionProfile): Promise<boolean> {
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
					// Connection to the server failed
					reject(error);
				} else {
					resolve(connectResult);
				}
			});

			connectionInfo.serviceTimer = new Utils.Timer();

			// send connection request
			self.sendConnectRequest(connection, uri);
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
				}

				resolve(result);
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
				resolve(self.disconnectEditor(fileUri));
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
