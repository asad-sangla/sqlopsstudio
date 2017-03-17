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
import { IConnectionManagementService, IConnectionDialogService, INewConnectionParams,
	ConnectionType, IConnectableEditor } from 'sql/parts/connection/common/connectionManagement';
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
import { ConnectionFactory } from 'sql/parts/connection/node/connectionFactory';
import Event, { Emitter } from 'vs/base/common/event';

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ConnectionProvider; } = Object.create(null);

	private _connectionFactory: ConnectionFactory;

	private _onAddConnectionProfile: Emitter<void>;
	private _onDeleteConnectionProfile: Emitter<void>;

	constructor(
		private _connectionMemento: Memento,
		private _connectionStore: ConnectionStore,
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
		// _connectionMemento and _connectionStore are in constructor to enable this class to be more testable
		if (!this._connectionMemento) {
			this._connectionMemento = new Memento('ConnectionManagement');
		}
		if (!this._connectionStore) {
			this._connectionStore = new ConnectionStore(_storageService, this._connectionMemento,
				_configurationEditService, this._workspaceConfigurationService, this._credentialsService, this._capabilitiesService);
		}

		this._connectionFactory = new ConnectionFactory();

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

	public newConnection(params?: INewConnectionParams, model?: IConnectionProfile): void {
		if (!params) {
			params = { connectionType: ConnectionType.default };
		}
		this._connectionDialogService.showDialog(this, params, model);
	}

	public addConnectionProfile(connection: IConnectionProfile): Promise<boolean> {
		let uri = this._connectionFactory.getUniqueUri(connection);

		return new Promise<boolean>((resolve, reject) => {
			this._statusService.setStatusMessage('Connecting...');
			//If there's an open connection with the same id then don't connect again
			if (!this._connectionFactory.hasConnection(connection, uri)) {
				return this.connect(uri, connection).then(connected => {
					if (connected) {
						this.saveToSettings(connection).then(value => {
							if (value) {
								this._onAddConnectionProfile.fire();
							}
						});
						this.showDashboard(uri, connection);
					}
					resolve(connected);
				}).catch(err => {
					reject(err);
					this._connectionFactory.deleteConnection(uri);
				});
			} else {
				return resolve(true);
			}
		});
	}

	private showDashboard(uri: string, connection: IConnectionProfile): Promise<boolean> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			let dashboardInput: DashboardInput = self._instantiationService.createInstance(DashboardInput, uri, connection);
			self._editorService.openEditor(dashboardInput, { pinned: true }, false);
			resolve(true);
		});
	}

	public getConnectionGroups(): ConnectionProfileGroup[] {
		return this._connectionStore.getConnectionProfileGroups();
	}

	public getRecentConnections(): ConnectionProfile[] {
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
		//TODO: create the model to send for connecting
		let connectionInfo = Object.assign({}, {
			serverName: connection.serverName,
			databaseName: connection.databaseName,
			userName: connection.userName,
			password: connection.password,
			authenticationType: connection.authenticationType
		});
		return new Promise((resolve, reject) => {
			for (var key in this._providers) {
				this._providers[key].connect(uri, connectionInfo);
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

	private getActiveEditorUri(): string {
		try {
			let activeEditor = this._editorService.getActiveEditor();
			if (activeEditor !== undefined) {
				return this.getActiveEditorInputResource();
			} else {
				return undefined;
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
		let connection = this._connectionFactory.onConnectionComplete(connectionInfoSummary.ownerUri, connectionInfoSummary.connectionId);

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
		this._connectionMemento.saveMemento();
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

	public connectEditor(editor: IConnectableEditor, uri: string, runQueryOnCompletion: boolean, connectionProfile: ConnectionProfile | IConnectionProfile): Promise<boolean> {
		// If we are passed a ConnectionProfile, we must only pass the info below or the connection will reject
		let connection: IConnectionProfile = {
			serverName: connectionProfile.serverName,
			databaseName: connectionProfile.databaseName,
			userName: connectionProfile.userName,
			password: connectionProfile.password,
			authenticationType: connectionProfile.authenticationType,
			groupId: connectionProfile.groupId,
			groupName: connectionProfile.groupName,
			savePassword: connectionProfile.savePassword,
			getUniqueId: undefined,
			providerName: ''
		};

		// Retrieve saved password if needed
        return new Promise<boolean>((resolve, reject) => {
            this._connectionStore.addSavedPassword(connection).then(newConnection => {
				editor.onConnectStart();
				return this.connect(uri, newConnection).then(status => {
					if (status) {
						editor.onConnectSuccess(runQueryOnCompletion);
					} else {
						editor.onConnectReject();
					}
                    resolve(status);
                }, (error) => {
					editor.onConnectReject();
				});
            });
        });
	}

	public connectProfile(connectionProfile: ConnectionProfile): Promise<boolean> {
		let uri = this._connectionFactory.getUniqueUri(connectionProfile);
		let connection: IConnectionProfile = {
			serverName: connectionProfile.serverName,
			databaseName: connectionProfile.databaseName,
			userName: connectionProfile.userName,
			password: connectionProfile.password,
			authenticationType: connectionProfile.authenticationType,
			groupId: connectionProfile.groupId,
			groupName: connectionProfile.groupName,
			savePassword: connectionProfile.savePassword,
			getUniqueId: undefined,
			providerName: ''
		};

		// Retreive saved password if needed
		return new Promise<boolean>((resolve, reject) => {
			this._statusService.setStatusMessage('Connecting...');
			this._connectionStore.addSavedPassword(connection).then(newConnection => {
				if (!this._connectionFactory.hasConnection(connection, uri)) {
					return this.connect(uri, connection).then(connected => {
						if (connected) {
							this.showDashboard(uri, connection);
						}
						resolve(connected);
					}).catch(err => {
						reject(err);
						this._connectionFactory.deleteConnection(uri);
					});
				} else {
					return resolve(true);
				}
			});
		});
	}

	// Disconnect a URI from its current connection
	public disconnectEditor(editor: IConnectableEditor, uri: string, force: boolean = false): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			// If the URI is connected, disconnect it and the editor
			if (self.isConnected(uri)) {
				editor.onDisconnect();
				resolve(self.doDisconnect(uri));

			// If the URI is connecting, prompt the user to cancel connecting
			} else if (self.isConnecting(uri)) {
				if (!force) {
					self.shouldCancelConnect(uri).then((result) => {
						// If the user wants to cancel, then disconnect
						if (result) {
							editor.onDisconnect();
							resolve(self.doCancelConnect(editor));
						}
						// If the user does not want to cancel, then ignore
						resolve(false);
					});
				} else {
					editor.onDisconnect();
					resolve(self.doCancelConnect(editor));
				}
			}
			// If the URI is disconnected, ensure the UI state is consistent and resolve true
			editor.onDisconnect();
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
			let connectionInfo = this._connectionFactory.addConnection(connection, uri);
			// Setup the handler for the connection complete notification to call
			connectionInfo.connectHandler = ((connectResult, error) => {
				if (error) {
					// Connection to the server failed
					reject(error);
				} else {
					resolve(connectResult);
				}
			});

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
			let choices: { key, value }[] = [
				{ key: nls.localize('yes', 'Yes'), value: true },
				{ key: nls.localize('no', 'No'), value: false }
			];

			self.quickOpenService.pick(choices.map(x => x.key), { placeHolder: nls.localize('cancelConnetionConfirmation', 'Are you sure you want to cancel this connection?'), ignoreFocusLost: true }).then((choice) => {
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
					this._connectionFactory.deleteConnection(fileUri);
					// TODO: show diconnection in status statusview
					// self.statusView.notConnected(fileUri);

					// TODO: send telemetry events
					// Telemetry.sendTelemetryEvent('DatabaseDisconnected');
				}

				resolve(result);
			});
		});
	}

	private doCancelConnect(editor: IConnectableEditor): Thenable<boolean> {
		const self = this;
		let fileUri: string = editor.uri;

		return new Promise<boolean>((resolve, reject) => {
			// Check if we are still conecting after user input
			if (self.isConnecting(fileUri)) {
				// Create a new set of cancel connection params with our file URI
				let cancelParams: ConnectionContracts.CancelConnectParams = new ConnectionContracts.CancelConnectParams();
				cancelParams.ownerUri = fileUri;

				this._connectionFactory.deleteConnection(fileUri);
				// Send connection cancellation request
				resolve(self.sendCancelRequest(fileUri));
			} else {
				// If we are not connecting anymore let disconnect handle the next steps
				resolve(self.disconnectEditor(editor, fileUri));
			}
		});
	}

	// Is a certain file URI connected?
	public isConnected(fileUri: string): boolean {
		return this._connectionFactory.isConnected(fileUri);
	}

	// Is a certain file URI currently connecting
	private isConnecting(fileUri: string): boolean {
		return this._connectionFactory.isConnecting(fileUri);
	}
}
