/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import {
	IConnectionDialogService, IConnectionManagementService, IErrorMessageService,
	ConnectionType, INewConnectionParams, IConnectionCompletionOptions
} from 'sql/parts/connection/common/connectionManagement';
import { ConnectionDialogWidget, OnShowUIResponse } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { ConnectionController } from 'sql/parts/connection/connectionDialog/connectionController';
import * as WorkbenchUtils from 'sql/workbench/common/sqlWorkbenchUtils';
import * as Constants from 'sql/parts/connection/common/constants';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { localize } from 'vs/nls';

import * as data from 'data';

import { IPartService } from 'vs/workbench/services/part/common/partService';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';
import { IWorkspaceConfigurationService } from 'vs/workbench/services/configuration/common/configuration';

export interface IConnectionResult {
	isValid: boolean;
	connection: IConnectionProfile;
}

export interface IConnectionComponentCallbacks {
	onSetConnectButton: (enable: boolean) => void;
	onCreateNewServerGroup?: () => void;
	onAdvancedProperties?: () => void;
	onSetAzureTimeOut?: () => void;
}

export interface IConnectionComponentController {
	showUiComponent(container: HTMLElement): void;
	initDialog(model: IConnectionProfile): void;
	validateConnection(): IConnectionResult;
	fillInConnectionInputs(connectionInfo: IConnectionProfile): void;
	handleOnConnecting(): void;
	handleResetConnection(): void;
	focusOnOpen(): void;
}

export class ConnectionDialogService implements IConnectionDialogService {

	_serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;
	private _container: HTMLElement;
	private _connectionDialog: ConnectionDialogWidget;
	private _connectionControllerMap: { [providerDisplayName: string]: IConnectionComponentController };
	private _model: ConnectionProfile;
	private _params: INewConnectionParams;
	private _inputModel: IConnectionProfile;
	private _capabilitiesMaps: { [providerDisplayName: string]: data.DataProtocolServerCapabilities };
	private _providerNameToDisplayNameMap: { [providerDisplayName: string]: string };
	private _providerTypes: string[];
	private _currentProviderType: string = 'Microsoft SQL Server';
	private _connecting: boolean = false;
	private _connectionErrorTitle = localize('connectionError', 'Connection Error');

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
		@IWorkspaceConfigurationService private _workspaceConfigurationService: IWorkspaceConfigurationService
	) {
		this._capabilitiesMaps = {};
		this._providerNameToDisplayNameMap = {};
		this._connectionControllerMap = {};
		this._providerTypes = [];
		if (_capabilitiesService) {
			_capabilitiesService.onProviderRegisteredEvent((capabilities => {
				let defaultProvider = this.getDefaultProviderName();
				if (capabilities.providerName === defaultProvider) {
					this.showDialogWithModel();
				}
			}));
		}
	}

	private getDefaultProviderName() {
		if (this._workspaceConfigurationService) {
			let defaultProvider = WorkbenchUtils.getSqlConfigValue<string>(this._workspaceConfigurationService, Constants.defaultEngine);
			if (defaultProvider
				&& this._capabilitiesMaps
				&& defaultProvider in this._capabilitiesMaps) {
				return defaultProvider;
			}
		}
		// as a fallback, default to MSSQL if the value from settings is not available
		return Constants.mssqlProviderName;
	}

	private handleOnConnect(params: INewConnectionParams, profile?: IConnectionProfile): void {
		if (!this._connecting) {
			this._connecting = true;
			this.handleProviderOnConnecting();
			if (!profile) {
				let result = this.uiController.validateConnection();
				if (!result.isValid) {
					this._connecting = false;
					this._connectionDialog.resetConnection();
					return;
				}
				profile = result.connection;

				// Disable password prompt during reconnect if connected with an empty password
				if (profile.password === '' && profile.savePassword === false) {
					profile.savePassword = true;
				}

				this.handleDefaultOnConnect(params, profile);
			} else {
				this._connectionManagementService.addSavedPassword(profile).then(connectionWithPassword => {
					this.handleDefaultOnConnect(params, connectionWithPassword);
				});
			}
		}
	}

	private handleOnCancel(params: INewConnectionParams): void {
		if (params && params.input && params.connectionType === ConnectionType.editor) {
			this._connectionManagementService.cancelEditorConnection(params.input);
			params.input.onConnectReject();
		} else {
			this._connectionManagementService.cancelConnection(this._model);
		}
		this._connectionDialog.resetConnection();
		this._connecting = false;
	}

	private handleDefaultOnConnect(params: INewConnectionParams, connection: IConnectionProfile): void {
		let fromEditor = params && params.connectionType === ConnectionType.editor;
		let uri: string = undefined;
		if (fromEditor && params.input) {
			uri = params.input.uri;
		}
		let options: IConnectionCompletionOptions = {
			params: params,
			saveTheConnection: !fromEditor,
			showDashboard: !fromEditor,
			showConnectionDialogOnError: false,
			showFirewallRuleOnError: true
		};

		this._connectionManagementService.connectAndSaveProfile(connection, uri, options, params.input).then(connectionResult => {
			this._connecting = false;
			if (connectionResult && connectionResult.connected) {
				this._connectionDialog.close();
			} else if (connectionResult && connectionResult.errorHandled) {
				this._connectionDialog.resetConnection();
			} else {
				this._errorMessageService.showDialog(Severity.Error, this._connectionErrorTitle, connectionResult.errorMessage);
				this._connectionDialog.resetConnection();
			}
		}).catch(err => {
			this._connecting = false;
			this._errorMessageService.showDialog(Severity.Error, this._connectionErrorTitle, err);
			this._connectionDialog.resetConnection();
		});
	}

	private get uiController(): IConnectionComponentController {
		// Find the provider name from the selected provider type, or throw an error if it does not correspond to a known provider
		let providerName = this.getCurrentProviderName();
		if (!providerName) {
			throw Error('Invalid provider type');
		}

		// Set the model name, initialize the controller if needed, and return the controller
		this._model.providerName = providerName;
		if (!this._connectionControllerMap[providerName]) {
			this._connectionControllerMap[providerName] = this._instantiationService.createInstance(ConnectionController, this._container, this._connectionManagementService, this._capabilitiesMaps[providerName], {
				onSetConnectButton: (enable: boolean) => this.handleSetConnectButtonEnable(enable)
			}, providerName);
		}
		return this._connectionControllerMap[providerName];
	}

	private handleSetConnectButtonEnable(enable: boolean): void {
		this._connectionDialog.connectButtonState = enable;
	}

	private handleShowUiComponent(input: OnShowUIResponse) {
		this._currentProviderType = input.selectedProviderType;
		this._model = new ConnectionProfile(this._capabilitiesMaps[this.getCurrentProviderName()], this._model);
		this.uiController.showUiComponent(input.container);
	}

	private handleInitDialog() {
		this.uiController.initDialog(this._model);
	}

	private handleFillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._connectionManagementService.addSavedPassword(connectionInfo).then(connectionWithPassword => {
			var model = this.createModel(connectionWithPassword);
			this.uiController.fillInConnectionInputs(model);
		});
		this._connectionDialog.updateProvider(this._providerNameToDisplayNameMap[connectionInfo.providerName]);
	}

	private handleProviderOnResetConnection(): void {
		this.uiController.handleResetConnection();
	}

	private handleProviderOnConnecting(): void {
		this.uiController.handleOnConnecting();
	}

	private updateModelServerCapabilities(model: IConnectionProfile) {
		this._model = this.createModel(model);
		this._currentProviderType = this._providerNameToDisplayNameMap[this._model.providerName];
		if (this._connectionDialog) {
			this._connectionDialog.updateProvider(this._currentProviderType);
		}
	}

	private createModel(model: IConnectionProfile): ConnectionProfile {
		let defaultProvider = this.getDefaultProviderName();
		let providerName = model ? model.providerName : defaultProvider;
		providerName = providerName ? providerName : defaultProvider;
		let serverCapabilities = this._capabilitiesMaps[providerName];
		let newProfile = new ConnectionProfile(serverCapabilities, model);
		newProfile.saveProfile = true;
		newProfile.generateNewId();
		// If connecting from a query editor set "save connection" to false
		if (this._params && this._params.input && this._params.connectionType === ConnectionType.editor) {
			newProfile.saveProfile = false;
		}
		return newProfile;
	}

	private cacheCapabilities(capabilities: data.DataProtocolServerCapabilities) {
		if (capabilities) {
			this._providerTypes.push(capabilities.providerDisplayName);
			this._capabilitiesMaps[capabilities.providerName] = capabilities;
			this._providerNameToDisplayNameMap[capabilities.providerName] = capabilities.providerDisplayName;
		}
	}

	private showDialogWithModel(): TPromise<void> {
		return new TPromise<void>((resolve, reject) => {
			if (this.getDefaultProviderName() in this._capabilitiesMaps) {
				this.updateModelServerCapabilities(this._inputModel);

				this.doShowDialog(this._params);
			}
			let none: void;
			resolve(none);
		});
	}

	public showDialog(
		connectionManagementService: IConnectionManagementService,
		params: INewConnectionParams,
		model?: IConnectionProfile,
		error?: string): TPromise<void> {

		this._connectionManagementService = connectionManagementService;
		this._params = params;
		this._inputModel = model;

		// only create the provider maps first time the dialog gets called
		if (this._providerTypes.length === 0) {
			let capabilities = this._capabilitiesService.getCapabilities();
			capabilities.forEach(c => {
				this.cacheCapabilities(c);
			});
		}

		this.updateModelServerCapabilities(model);
		// If connecting from a query editor set "save connection" to false
		if (params && params.input && params.connectionType === ConnectionType.editor) {
			this._model.saveProfile = false;
		}

		return this.showDialogWithModel().then(() => {
			if (error && error !== '') {
				this._errorMessageService.showDialog(Severity.Error, this._connectionErrorTitle, error);
			}
		});
	}

	private doShowDialog(params: INewConnectionParams): TPromise<void> {
		if (!this._connectionDialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._connectionDialog = this._instantiationService.createInstance(ConnectionDialogWidget, this._providerTypes, this._providerNameToDisplayNameMap[this._model.providerName]);
			this._connectionDialog.onCancel(() => this.handleOnCancel(this._connectionDialog.newConnectionParams));
			this._connectionDialog.onConnect((profile) => this.handleOnConnect(this._connectionDialog.newConnectionParams, profile));
			this._connectionDialog.onShowUiComponent((input) => this.handleShowUiComponent(input));
			this._connectionDialog.onInitDialog(() => this.handleInitDialog());
			this._connectionDialog.onFillinConnectionInputs((input) => this.handleFillInConnectionInputs(input));
			this._connectionDialog.onResetConnection(() => this.handleProviderOnResetConnection());
			this._connectionDialog.render();
		}
		this._connectionDialog.newConnectionParams = params;

		return new TPromise<void>(() => {
			this._connectionDialog.open(this._connectionManagementService.getRecentConnections().length > 0);
			this.uiController.focusOnOpen();
		});
	}

	private getCurrentProviderName(): string {
		return Object.keys(this._providerNameToDisplayNameMap).find(providerName => {
			return this._currentProviderType === this._providerNameToDisplayNameMap[providerName];
		});
	}
}
