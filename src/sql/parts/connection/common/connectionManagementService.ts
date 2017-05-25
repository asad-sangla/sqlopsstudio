/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import nls = require('vs/nls');
import * as errors from 'vs/base/common/errors';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import {
	IConnectionManagementService, IConnectionDialogService, INewConnectionParams,
	ConnectionType, IConnectableInput, IConnectionCompletionOptions, IConnectionCallbacks, IConnectionChangedParams,
	IConnectionParams, IConnectionResult, IServerGroupController
} from 'sql/parts/connection/common/connectionManagement';
import platform = require('vs/platform/platform');
import { Memento } from 'vs/workbench/common/memento';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ConnectionStore } from './connectionStore';
import { IConnectionProfile } from './interfaces';
import { ConnectionProfileGroup, IConnectionProfileGroup } from './connectionProfileGroup';
import { IConfigurationEditingService } from 'vs/workbench/services/configuration/common/configurationEditing';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';
import { ConnectionManagementInfo } from './connectionManagementInfo';
import Utils = require('./utils');
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import { ICredentialsService } from 'sql/services/credentials/credentialsService';
import * as data from 'data';
import * as ConnectionContracts from 'sql/parts/connection/common/connection';
import { IQuickOpenService } from 'vs/platform/quickOpen/common/quickOpen';
import { ConnectionStatusManager } from 'sql/parts/connection/common/connectionStatusManager';
import Event, { Emitter } from 'vs/base/common/event';
import { ISplashScreenService } from 'sql/workbench/splashScreen/splashScreenService';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { DashboardInput } from 'sql/parts/dashboard/dashboardInput';
import { EditorGroup } from "vs/workbench/common/editor/editorStacksModel";
import { EditorPart } from 'vs/workbench/browser/parts/editor/editorPart';
import statusbar = require('vs/workbench/browser/parts/statusbar/statusbar');
import { IStatusbarService } from 'vs/platform/statusbar/common/statusbar';
import { ConnectionGlobalStatus } from 'sql/parts/connection/common/connectionGlobalStatus';
import { ConnectionStatusbarItem } from 'sql/parts/connection/common/connectionStatus';
import { CommandsRegistry, ICommandService, ICommandHandler } from 'vs/platform/commands/common/commands';

export class ConnectionManagementService implements IConnectionManagementService {

	_serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.ConnectionProvider; } = Object.create(null);

	private _uriToProvider: { [uri: string]: string; } = Object.create(null);

	private _connectionStatusManager: ConnectionStatusManager;

	private _onAddConnectionProfile: Emitter<void>;
	private _onDeleteConnectionProfile: Emitter<void>;
	private _onConnect: Emitter<IConnectionParams>;
	private _onDisconnect: Emitter<IConnectionParams>;
	private _onConnectRequestSent: Emitter<void>;
	private _onConnectionChanged: Emitter<IConnectionChangedParams>;

	private _connectionGlobalStatus: ConnectionGlobalStatus;

	constructor(
		private _connectionMemento: Memento,
		private _connectionStore: ConnectionStore,
		@ISplashScreenService private _splashScreen: ISplashScreenService,
		@IConnectionDialogService private _connectionDialogService: IConnectionDialogService,
		@IServerGroupController private _serverGroupController: IServerGroupController,
		@ICommandService private _commandService: ICommandService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IWorkspaceContextService private _contextService: IWorkspaceContextService,
		@IStorageService private _storageService: IStorageService,
		@ITelemetryService private _telemetryService: ITelemetryService,
		@IConfigurationEditingService private _configurationEditService: IConfigurationEditingService,
		@IWorkspaceConfigurationService private _workspaceConfigurationService: IWorkspaceConfigurationService,
		@ICredentialsService private _credentialsService: ICredentialsService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IQuickOpenService private _quickOpenService: IQuickOpenService,
		@IEditorGroupService private _editorGroupService: IEditorGroupService,
		@IStatusbarService private _statusBarService: IStatusbarService
	) {
		// _connectionMemento and _connectionStore are in constructor to enable this class to be more testable
		if (!this._connectionMemento) {
			this._connectionMemento = new Memento('ConnectionManagement');
		}
		if (!this._connectionStore) {
			this._connectionStore = new ConnectionStore(_storageService, this._connectionMemento,
				_configurationEditService, this._workspaceConfigurationService, this._credentialsService, this._capabilitiesService);
		}

		this._connectionStatusManager = new ConnectionStatusManager(this._capabilitiesService);
		this._connectionGlobalStatus = new ConnectionGlobalStatus(this._statusBarService);

		// Setting up our event emitters
		this._onAddConnectionProfile = new Emitter<void>();
		this._onDeleteConnectionProfile = new Emitter<void>();
		this._onConnect = new Emitter<IConnectionParams>();
		this._onDisconnect = new Emitter<IConnectionParams>();
		this._onConnectionChanged = new Emitter<IConnectionChangedParams>();
		this._onConnectRequestSent = new Emitter<void>();

		// Register Statusbar item
		(<statusbar.IStatusbarRegistry>platform.Registry.as(statusbar.Extensions.Statusbar)).registerStatusbarItem(new statusbar.StatusbarItemDescriptor(
			ConnectionStatusbarItem,
			statusbar.StatusbarAlignment.RIGHT,
			100 /* High Priority */
		));

		if (_capabilitiesService && _capabilitiesService.onProviderRegisteredEvent) {
			_capabilitiesService.onProviderRegisteredEvent((capabilities => {
				if (capabilities.providerName === 'MSSQL') {
					if (!this.hasRegisteredServers()) {
						// prompt the user for a new connection on startup if no profiles are registered
						this.showConnectionDialog();
					}
				}
			}));
		}

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

	public get onConnect(): Event<IConnectionParams> {
		return this._onConnect.event;
	}

	public get onDisconnect(): Event<IConnectionParams> {
		return this._onDisconnect.event;
	}

	public get onConnectionChanged(): Event<IConnectionChangedParams> {
		return this._onConnectionChanged.event;
	}

	public get onConnectionRequestSent(): Event<void> {
		return this._onConnectRequestSent.event;
	}

	private _providerCount: number = 0;

	// Connection Provider Registration
	public registerProvider(providerId: string, provider: data.ConnectionProvider): void {
		this._providers[providerId] = provider;

		// temporarily close splash screen when a connection provider has been registered
		// @todo remove this code once a proper initialization event is available (karlb 4/1/2017)
		++this._providerCount;
		if (this._providerCount === 1 && this._splashScreen !== undefined) {
			this._splashScreen.hideSplashScreen();

			// show the Registered Server viewlet
			this._commandService.executeCommand('workbench.view.connections', {});
		}
	}

	/**
	 * Opens the connection dialog
	 * @param params Include the uri, type of connection
	 * @param model the existing connection profile to create a new one from
	 */
	public showConnectionDialog(params?: INewConnectionParams, model?: IConnectionProfile, error?: string): Promise<void> {
		let self = this;
		return new Promise<void>((resolve, reject) => {
			if (!params) {
				params = { connectionType: ConnectionType.default };
			}
			if (!model && params.input && params.input.uri) {
				model = this._connectionStatusManager.getConnectionProfile(params.input.uri);
			}
			self._connectionDialogService.showDialog(self, params, model, error).then(() => {
				resolve();
			}, error => {
				reject();
			});
		});
	}

	/**
	 * Opens the add server group dialog
	 */
	public showServerGroupDialog(): Promise<void> {
		let self = this;
		return new Promise<void>((resolve, reject) => {
			self._serverGroupController.showDialog(self).then(() => {
				resolve();
			}, error => {
				reject();
			});
		});
	}

	/**
	 * Load the password for the profile
	 * @param connectionProfile Connection Profile
	 */
	public addSavedPassword(connectionProfile: IConnectionProfile): Promise<IConnectionProfile> {
		return this._connectionStore.addSavedPassword(connectionProfile);
	}

	/**
	 * Get the connections provider ID from an connection URI
	 */
	public getProviderIdFromUri(ownerUri: string): string {
		return this._uriToProvider[ownerUri];
	}

	/**
	 * Loads the  password and try to connect. If fails, shows the dialog so user can change the connection
	 * @param Connection Profile
	 * @param owner of the connection. Can be the editors
	 * @param options to use after the connection is complete
	 */
	private tryConnect(connection: IConnectionProfile, owner: IConnectableInput, options?: IConnectionCompletionOptions): Promise<IConnectionResult> {
		return new Promise<IConnectionResult>((resolve, reject) => {
			// Load the password if it's not already loaded


			this._connectionStore.addSavedPassword(connection).then(newConnection => {
				if (Utils.isEmpty(newConnection.password) && this._connectionStore.isPasswordRequired(newConnection)) {
					let existingConnection = this._connectionStatusManager.findConnectionProfile(connection);
					if (existingConnection && existingConnection.connectionProfile) {
						newConnection.password = existingConnection.connectionProfile.password;
					}
				}
				// If the password is required and still not loaded show the dialog
				if (Utils.isEmpty(newConnection.password) && this._connectionStore.isPasswordRequired(newConnection)) {
					resolve(this.showConnectionDialogOnError(connection, owner, { connected: false, error: undefined }, options));
				} else {
					// Try to connect
					this.connectWithOptions(newConnection, owner.uri, options, owner).then(connectionResult => {
						if (!connectionResult.connected) {
							// If connection fails show the dialog
							resolve(this.showConnectionDialogOnError(connection, owner, connectionResult, options));
						} else {
							//Resolve with the connection result
							resolve(connectionResult);
						}
					}).catch(connectionError => {
						reject(connectionError);
					});
				}
			}).catch(err => {
				reject(err);
			});
		});
	}

	/**
	 * If showing the dialog on error is set to true in the options, shows the dialog with the error
	 * otherwise does nothing
	 */
	private showConnectionDialogOnError(
		connection: IConnectionProfile,
		owner: IConnectableInput,
		connectionResult: IConnectionResult,
		options?: IConnectionCompletionOptions): Promise<IConnectionResult> {

		return new Promise<IConnectionResult>((resolve, reject) => {
			if (options && options.showConnectionDialogOnError) {
				let params: INewConnectionParams = options && options.params ? options.params : {
					connectionType: this._connectionStatusManager.isDefaultTypeUri(owner.uri) ? ConnectionType.default : ConnectionType.editor,
					input: owner,
					runQueryOnCompletion: false
				};
				this.showConnectionDialog(params, connection, connectionResult.error).then(() => {
					resolve(connectionResult);
				}).catch(err => {
					reject(err);
				});
			} else {
				resolve(connectionResult);
			}
		});
	}

	/**
	 * Load the password and opens a new connection
	 * @param Connection Profile
	 * @param uri assigned to the profile (used only when connecting from an editor)
	 * @param options to be used after the connection is completed
	 * @param callbacks to call after the connection is completed
	 */
	public connect(connection: IConnectionProfile, uri: string, options?: IConnectionCompletionOptions, callbacks?: IConnectionCallbacks): Promise<IConnectionResult> {
		if (Utils.isEmpty(uri)) {
			uri = this._connectionStatusManager.getConnectionManagementId(connection);
		}
		let input: IConnectableInput = options && options.params ? options.params.input : undefined;
		if (!input) {
			input = {
				onConnectReject: callbacks ? callbacks.onConnectReject : undefined,
				onConnectStart: callbacks ? callbacks.onConnectStart : undefined,
				onConnectSuccess: callbacks ? callbacks.onConnectSuccess : undefined,
				onDisconnect: callbacks ? callbacks.onDisconnect : undefined,
				uri: uri
			};
		}


		if (uri !== input.uri) {
			//TODO: this should never happen. If the input is already passed, it should have the uri
			Utils.logDebug(`the given uri is different that the input uri. ${uri}|${input.uri}`);
		}
		return this.tryConnect(connection, input, options);
	}

	/**
	 * Opens a new connection and saves the profile in the settings.
	 * This method doesn't load the password because it only gets called from the
	 * connection dialog and password should be already in the profile
	 */
	public connectAndSaveProfile(connection: IConnectionProfile, uri: string, options?: IConnectionCompletionOptions, callbacks?: IConnectionCallbacks):
		Promise<IConnectionResult> {
		if (!options) {
			options = {
				saveTheConnection: true,
				showDashboard: false,
				params: undefined,
				showConnectionDialogOnError: false
			};
		}

		// Always set the Save connection to true when connecting from the dialog so connections will be saved to MRU
		// If connection.saveProfile is set to true, the connection will be saved to settings also
		options.saveTheConnection = true;
		return this.connectWithOptions(connection, uri, options, callbacks);
	}

	private connectWithOptions(connection: IConnectionProfile, uri: string, options?: IConnectionCompletionOptions, callbacks?: IConnectionCallbacks):
		Promise<IConnectionResult> {
		if (Utils.isEmpty(uri)) {
			uri = this._connectionStatusManager.getConnectionManagementId(connection);
		}
		if (!callbacks) {
			callbacks = {
				onConnectReject: () => { },
				onConnectStart: () => { },
				onConnectSuccess: () => { },
				onDisconnect: () => { }
			};
		}
		if (!options) {
			options = {
				saveTheConnection: false,
				showDashboard: false,
				params: undefined,
				showConnectionDialogOnError: false
			};
		}
		return new Promise<IConnectionResult>((resolve, reject) => {
			if (callbacks.onConnectStart) {
				callbacks.onConnectStart();
			}
			return this.createNewConnection(uri, connection).then(connectionResult => {
				if (connectionResult && connectionResult.connected) {
					if (callbacks.onConnectSuccess) {
						callbacks.onConnectSuccess(options.params);
					}
					if (options.saveTheConnection) {
						this.saveToSettings(uri, connection).then(value => {
							this._onAddConnectionProfile.fire();
							this.doActionsAfterConnectionComplete(value, options);
						});
					} else {
						connection.saveProfile = false;
						this.doActionsAfterConnectionComplete(uri, options);
					}

				} else {
					if (callbacks.onConnectReject) {
						callbacks.onConnectReject('Connection Not Accepted');
					}
				}
				resolve(connectionResult);
			}).catch(err => {
				reject(err);
				if (callbacks.onConnectReject) {
					callbacks.onConnectReject(err);
				}
			});
		});
	}

	private doActionsAfterConnectionComplete(uri: string, options: IConnectionCompletionOptions, ) {
		let connectionManagementInfo = this._connectionStatusManager.findConnection(uri);
		if (options.showDashboard) {
			this.showDashboard(uri, connectionManagementInfo);
		}
		this._onConnect.fire(<IConnectionParams>{
			connectionUri: uri,
			connectionProfile: connectionManagementInfo.connectionProfile
		});
	}

	public showDashboard(uri: string, connection: ConnectionManagementInfo): Promise<boolean> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			let dashboardInput: DashboardInput = self._instantiationService ? self._instantiationService.createInstance(DashboardInput, uri, connection) : undefined;
			// if dashboard uri is already open, focus on that tab
			let found = self.focusDashboard(uri);
			if (!found) {
				self._editorService.openEditor(dashboardInput, { pinned: true }, false);
			}
			resolve(true);
		});
	}

	private focusDashboard(uri): boolean {
		let found: boolean = false;
		let options = {
			preserveFocus: false,
			revealIfVisible: true,
			revealInCenterIfOutsideViewport: true,
			pinned: true
		};
		let model = this._editorGroupService.getStacksModel();
		// check if editor is already present
		if (model) {
			model.groups.map(group => {
				if (group instanceof EditorGroup) {
					group.getEditors().map(editor => {
						if (editor instanceof DashboardInput) {
							if (editor.getUri() === uri) {
								// change focus to the matched editor
								let position = model.positionOfGroup(group);
								this._editorGroupService.activateGroup(model.groupAt(position));
								this._editorService.openEditor(editor, options, position)
									.done(() => {
										this._editorGroupService.activateGroup(model.groupAt(position));
										found = true;
									}, errors.onUnexpectedError);
							}
						}
					});
				}
			});
		}
		return found;
	}

	public closeDashboard(uri: string): void {
		let model = this._editorGroupService.getStacksModel();
		if (model) {
			model.groups.map(group => {
				if (group instanceof EditorGroup) {
					group.getEditors().map(editor => {
						if (editor instanceof DashboardInput) {
							if (editor.getUri() === uri && this._editorGroupService instanceof EditorPart) {
								// close matched editor
								let position = model.positionOfGroup(group);
								this._editorGroupService.closeEditor(position, editor);
							}
						}
					});
				}
			});
		}
	}

	public getConnectionGroups(): ConnectionProfileGroup[] {
		return this._connectionStore.getConnectionProfileGroups();
	}

	public getRecentConnections(): ConnectionProfile[] {
		return this._connectionStore.getRecentlyUsedConnections();
	}


	public clearRecentConnectionsList(): void {
		return this._connectionStore.clearRecentlyUsed();
	}

	public getActiveConnections(): ConnectionProfile[] {
		return this._connectionStore.getActiveConnections();
	}

	public saveProfileGroup(profile: IConnectionProfileGroup): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			this._connectionStore.saveProfileGroup(profile).then(groupId => {
				this._onAddConnectionProfile.fire();
				resolve(groupId);
			}).catch(err => {
				reject(err);
			});
		});
	}

	public getCapabilities(providerName: string): data.DataProtocolServerCapabilities {
		let capabilities = this._capabilitiesService.getCapabilities();
		if (capabilities !== undefined && capabilities.length > 0) {
			return capabilities.find(c => c.providerName === providerName);
		}
		return undefined;
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

	public hasRegisteredServers(): boolean {
		return this.doHasRegisteredServers(this.getConnectionGroups());
	}

	private doHasRegisteredServers(root: ConnectionProfileGroup[]): boolean {

		if (!root || root.length === 0) {
			return false;
		}

		for (let i = 0; root.length; ++i) {
			let item = root[i];

			if (!item) {
				return false;
			}

			if (item.connections && item.connections.length > 0) {
				return true;
			}

			if (this.doHasRegisteredServers(item.children)) {
				return true;
			}
		}

		return false;
	}

	public getConnectionId(connectionProfile: ConnectionProfile): string {
		return this._connectionStatusManager.getConnectionManagementId(connectionProfile);
	}

	// Request Senders
	private sendConnectRequest(connection: IConnectionProfile, uri: string): Thenable<boolean> {
		let connectionInfo = Object.assign({}, {
			options: connection.options
		});

		// setup URI to provider ID map for connection
		this._uriToProvider[uri] = connection.providerName;

		return new Promise<boolean>((resolve, reject) => {
			this._providers[connection.providerName].connect(uri, connectionInfo);
			this._onConnectRequestSent.fire();
			resolve(true);
		});
	}

	private sendDisconnectRequest(uri: string): Thenable<boolean> {
		let providerId: string = this.getProviderIdFromUri(uri);
		if (!providerId) {
			return Promise.resolve(false);
		}

		return new Promise<boolean>((resolve, reject) => {
			this._providers[providerId].disconnect(uri);
			resolve(true);
		});
	}

	private sendCancelRequest(uri: string): Thenable<boolean> {
		let providerId: string = this.getProviderIdFromUri(uri);
		if (!providerId) {
			return Promise.resolve(false);
		}

		return new Promise<boolean>((resolve, reject) => {
			this._providers[providerId].cancelConnect(uri);
			resolve(true);
		});
	}

	private sendListDatabasesRequest(uri: string): Thenable<data.ListDatabasesResult> {
		let providerId: string = this.getProviderIdFromUri(uri);
		if (!providerId) {
			return Promise.resolve(undefined);
		}

		return new Promise<data.ListDatabasesResult>((resolve, reject) => {
			let provider = this._providers[providerId];
			provider.listDatabases(uri).then(result => {
				resolve(result);
			}, error => {
				reject(error);
			});
		});
	}

	private saveToSettings(id: string, connection: IConnectionProfile): Promise<string> {

		return new Promise<string>((resolve, reject) => {
			this._connectionStore.saveProfile(connection).then(savedProfile => {
				let newId = this._connectionStatusManager.updateConnectionProfile(savedProfile, id);
				return resolve(newId);
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

	public onConnectionComplete(handle: number, info: data.ConnectionInfoSummary): void {
		const self = this;
		let connection = this._connectionStatusManager.onConnectionComplete(info);

		if (Utils.isNotEmpty(info.connectionId)) {
			if (info.connectionSummary && info.connectionSummary.databaseName) {
				connection.connectionProfile.databaseName = info.connectionSummary.databaseName;
			}
			connection.serverInfo = info.serverInfo;

			connection.connectHandler(true);
			let activeConnection = connection.connectionProfile;
			self.tryAddActiveConnection(connection, activeConnection);
		} else {
			connection.connectHandler(false, info.messages);
		}

		if (this._connectionStatusManager.isDefaultTypeUri(info.ownerUri)) {
			this._connectionGlobalStatus.setStatusToConnected(info.connectionSummary);
		}
	}

	public onConnectionChangedNotification(handle: number, changedConnInfo: data.ChangedConnectionInfo): void {
		let profile: IConnectionProfile = this._connectionStatusManager.onConnectionChanged(changedConnInfo);
		if (profile) {
			this._onConnectionChanged.fire(<IConnectionChangedParams>{
				connectionInfo: profile,
				connectionUri: changedConnInfo.connectionUri
			});
		}
	}

	public onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}

	public shutdown(): void {
		this._connectionStore.clearActiveConnections();
		this._connectionMemento.saveMemento();
	}

	public changeGroupIdForConnectionGroup(source: ConnectionProfileGroup, target: ConnectionProfileGroup): Promise<void> {
		return this._connectionStore.changeGroupIdForConnectionGroup(source, target);
	}

	public changeGroupIdForConnection(source: ConnectionProfile, targetGroupId: string): Promise<void> {
		let id = this._connectionStatusManager.getConnectionManagementId(source);
		return this._connectionStore.changeGroupIdForConnection(source, targetGroupId).then(result => {
			if (id && targetGroupId) {
				source.groupId = targetGroupId;
				this._connectionStatusManager.updateConnectionProfile(source, id);
			}
		});
	}

	/**
	 * Returns true if the connection can be moved to another group
	 */
	public canChangeConnectionConfig(profile: ConnectionProfile, newGroupID: string): boolean {
		return this._connectionStore.canChangeConnectionConfig(profile, newGroupID);
	}

	public isRecent(connectionProfile: ConnectionProfile): boolean {
		let recentConnections = this._connectionStore.getRecentlyUsedConnections();
		recentConnections = recentConnections.filter(con => {
			return connectionProfile.id === con.id;
		});
		return (recentConnections.length >= 1);
	}
	// Disconnect a URI from its current connection
	// The default editor implementation does not perform UI updates
	// The default force implementation is set to false
	public disconnectEditor(owner: IConnectableInput, force: boolean = false): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			// If the URI is connected, disconnect it and the editor
			if (self.isConnected(owner.uri)) {
				var connection = self.getConnectionProfile(owner.uri);
				owner.onDisconnect();
				resolve(self.doDisconnect(connection, owner.uri));

				// If the URI is connecting, prompt the user to cancel connecting
			} else if (self.isConnecting(owner.uri)) {
				if (!force) {
					self.shouldCancelConnect(owner.uri).then((result) => {
						// If the user wants to cancel, then disconnect
						if (result) {
							owner.onDisconnect();
							resolve(self.cancelEditorConnection(owner));
						}
						// If the user does not want to cancel, then ignore
						resolve(false);
					});
				} else {
					owner.onDisconnect();
					resolve(self.cancelEditorConnection(owner));
				}
			}
			// If the URI is disconnected, ensure the UI state is consistent and resolve true
			owner.onDisconnect();
			resolve(true);
		});
	}

	/**
	 * Functions to handle the connecting life cycle
	 */

	// Connect an open URI to a connection profile
	private createNewConnection(uri: string, connection: IConnectionProfile): Promise<IConnectionResult> {
		const self = this;

		return new Promise<IConnectionResult>((resolve, reject) => {
			let connectionInfo = this._connectionStatusManager.addConnection(connection, uri);
			// Setup the handler for the connection complete notification to call
			connectionInfo.connectHandler = ((connectResult, error) => {
				if (error) {
					// Connection to the server failed
					this._connectionStatusManager.deleteConnection(uri);
					resolve({ connected: connectResult, error: error });
				} else {
					resolve({ connected: connectResult, error: error });
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

			self._quickOpenService.pick(choices.map(x => x.key), { placeHolder: nls.localize('cancelConnectionConfirmation', 'Are you sure you want to cancel this connection?'), ignoreFocusLost: true }).then((choice) => {
				let confirm = choices.find(x => x.key === choice);
				resolve(confirm && confirm.value);
			});
		});
	}

	private doDisconnect(connection: IConnectionProfile, fileUri: string): Promise<boolean> {
		const self = this;

		return new Promise<boolean>((resolve, reject) => {
			let disconnectParams = new ConnectionContracts.DisconnectParams();
			disconnectParams.ownerUri = fileUri;

			// Send a disconnection request for the input URI
			self.sendDisconnectRequest(fileUri).then((result) => {
				// If the request was sent
				if (result) {
					this._connectionStatusManager.deleteConnection(fileUri);
					this._notifyDisconnected(connection, fileUri);

					if (this._connectionStatusManager.isDefaultTypeUri(fileUri)) {
						this._connectionGlobalStatus.setStatusToDisconnected(fileUri);
					}

					// TODO: send telemetry events
					// Telemetry.sendTelemetryEvent('DatabaseDisconnected');
				}

				resolve(result);
			});
		});
	}

	public disconnectProfile(connection: ConnectionProfile): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			let uri = this._connectionStatusManager.getConnectionManagementId(connection);

			this.doDisconnect(connection, uri).then(result => {
				if (result) {
					this._connectionStore.removeActiveConnection(connection);
					resolve(true);
				} else {
					reject(result);
				}
			});
			// close all dashboards
		});
	}

	public cancelConnection(connection: IConnectionProfile): Thenable<boolean> {
		let fileUri = this._connectionStatusManager.getConnectionManagementId(connection);
		return this.cancelConnectionForUri(fileUri);
	}

	public cancelConnectionForUri(fileUri: string): Thenable<boolean> {
		const self = this;
		return new Promise<boolean>((resolve, reject) => {
			// Create a new set of cancel connection params with our file URI
			let cancelParams: ConnectionContracts.CancelConnectParams = new ConnectionContracts.CancelConnectParams();
			cancelParams.ownerUri = fileUri;

			this._connectionStatusManager.deleteConnection(fileUri);
			// Send connection cancellation request
			resolve(self.sendCancelRequest(fileUri));
		});
	}

	public cancelEditorConnection(owner: IConnectableInput): Thenable<boolean> {
		const self = this;
		let fileUri: string = owner.uri;
		return new Promise<boolean>((resolve, reject) => {
			if (self.isConnecting(fileUri)) {
				this.cancelConnectionForUri(fileUri).then(result => {
					resolve(result);
				});
			} else {
				resolve(self.disconnectEditor(owner));
			}
		});
	}
	// Is a certain file URI connected?
	public isConnected(fileUri: string, connectionProfile?: ConnectionProfile): boolean {
		if (connectionProfile) {
			fileUri = this._connectionStatusManager.getConnectionManagementId(connectionProfile);
		}
		return this._connectionStatusManager.isConnected(fileUri);
	}

	public isProfileConnected(connectionProfile: IConnectionProfile): boolean {
		let connectionManagement = this._connectionStatusManager.findConnectionProfile(connectionProfile);
		return connectionManagement && !connectionManagement.connecting;
	}

	// Is a certain file URI currently connecting
	private isConnecting(fileUri: string): boolean {
		return this._connectionStatusManager.isConnecting(fileUri);
	}

	public getConnectionProfile(fileUri: string): IConnectionProfile {
		return this._connectionStatusManager.isConnected(fileUri) ? this._connectionStatusManager.getConnectionProfile(fileUri) : undefined;
	}

	public getConnectionInfo(fileUri: string): ConnectionManagementInfo {
		return this._connectionStatusManager.isConnected(fileUri) ? this._connectionStatusManager.findConnection(fileUri) : undefined;
	}

	public listDatabases(connectionUri: string): Thenable<data.ListDatabasesResult> {
		const self = this;
		if (self.isConnected(connectionUri)) {
			return self.sendListDatabasesRequest(connectionUri);
		}
		return Promise.resolve(undefined);
	}

	public changeDatabase(connectionUri: string, databaseName: string): Thenable<boolean> {
		let self = this;
		let profile = this.getConnectionProfile(connectionUri);
		if (profile) {
			// TODO should we clone this before altering? What happens if it fails?
			profile.databaseName = databaseName;
			return this.createNewConnection(connectionUri, profile).then(result => {
				if (!result || !result.connected) {
					// Note: Ideally this wouldn't disconnect on failure, but that's a separate issue that should
					// be addressed in the future
					self._notifyDisconnected(profile, connectionUri);
					return false;
				}
				return true;
			}, err => {
				self._notifyDisconnected(profile, connectionUri);
				return false;
			});
		}
		return Promise.resolve(undefined);
	}

	public renameGroup(group: ConnectionProfileGroup): Promise<void> {
		return this._connectionStore.renameGroup(group);
	}

	/**
	 * Deletes a connection from registered servers.
	 * Disconnects a connection before removing from settings.
	 */
	public deleteConnection(connection: ConnectionProfile): Promise<boolean> {
		// Disconnect if connected
		let uri = this._connectionStatusManager.getConnectionManagementId(connection);
		if (this.isConnected(uri)) {
			this.doDisconnect(connection, uri).then((result) => {
				if (result) {
					// Remove profile from configuration
					this._connectionStore.deleteConnectionFromConfiguration(connection).then(() => {
						this._onDeleteConnectionProfile.fire();
						Promise.resolve(true);
					}).catch(err => {
						// Reject promise if error occurred writing to settings
						Promise.reject(err);
					});

				} else {
					// If connection fails to disconnect, resolve promise with false
					Promise.resolve(false);
				}
			});
		} else {
			// Remove disconnected profile from settings
			this._connectionStore.deleteConnectionFromConfiguration(connection).then(() => {
				this._onDeleteConnectionProfile.fire();
				Promise.resolve(true);
			}).catch(err => {
				// Reject promise if error occured writing to settings
				Promise.reject(err);
			});
		}
		return Promise.resolve(undefined);
	}

	/**
	 * Deletes a group with all its children groups and connections from registered servers.
	 * Disconnects a connection before removing from config. If disconnect fails, settings is not modified.
	 */
	public deleteConnectionGroup(group: ConnectionProfileGroup): Promise<boolean> {
		// Get all connections for this group
		let connections = ConnectionProfileGroup.getConnectionsInGroup(group);

		// Disconnect all these connections
		let disconnected = [];
		connections.forEach((con) => {
			let uri = this._connectionStatusManager.getConnectionManagementId(con);
			if (this.isConnected(uri)) {
				disconnected.push(this.doDisconnect(con, uri));
			}
		});

		// When all the disconnect promises resolve, remove profiles from config
		Promise.all(disconnected).then(() => {
			// Remove profiles and groups from config
			this._connectionStore.deleteGroupFromConfiguration(group).then(() => {
				this._onDeleteConnectionProfile.fire();
				Promise.resolve(true);
			}).catch(err => {
				// If saving to config fails, reject promise with false
				return Promise.reject(false);
			});
		}).catch(err => {
			// If disconnecting all connected profiles fails, resolve promise with false
			return Promise.resolve(false);
		});
		return Promise.resolve(undefined);
	}

	private _notifyDisconnected(connectionProfile: IConnectionProfile, connectionUri: string): void {
		this._onDisconnect.fire(<IConnectionParams>{
			connectionUri: connectionUri,
			connectionProfile: connectionProfile
		});
	}
}
