/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import {
	IConnectionDialogService, IConnectionManagementService, IErrorMessageService,
	ConnectionType, INewConnectionParams, IConnectionCompletionOptions
} from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { withElementById } from 'vs/base/browser/builder';
import { SqlConnectionController } from 'sql/parts/connection/connectionDialog/sqlConnectionController';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';
import data = require('data');
import nls = require('vs/nls');

export interface IConnectionResult {
	isValid: boolean;
	connection: IConnectionProfile;
}

export interface IConnectionComponentCallbacks {
	onSetConnectButton: (enable: boolean) => void;
	onAdvancedProperties?: () => void;
	onSetAzureTimeOut?: () => void;
}

export interface IConnectionComponentController {
	showSqlUiComponent(): HTMLElement;
	initDialog(model: IConnectionProfile): void;
	validateConnection(): IConnectionResult;
	fillInConnectionInputs(connectionInfo: IConnectionProfile): void;
	handleOnConnecting(): void;
	handleResetConnection(): void;
}

export class ConnectionDialogService implements IConnectionDialogService {

	_serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;
	private _container: HTMLElement;
	private _connectionDialog: ConnectionDialogWidget;
	private _sqlConnectionController: SqlConnectionController;
	private _model: ConnectionProfile;
	private _params: INewConnectionParams;
	private _inputModel: IConnectionProfile;
	private _capabilitiesMaps: { [providerDisplayName: string]: data.DataProtocolServerCapabilities };
	private _providerNameToDisplayNameMap: { [providerDisplayName: string]: string };
	private _providerTypes: string[];
	private _defaultProviderName: string = 'MSSQL';

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
		this._capabilitiesMaps = {};
		this._providerNameToDisplayNameMap = {};
		this._providerTypes = [];
		if (_capabilitiesService) {
			_capabilitiesService.onProviderRegisteredEvent((capabilities => {
				if (capabilities.providerName === this._defaultProviderName) {
					this.showDialogWithModel();
				}
			}));
		}
	}

	private handleOnConnect(params: INewConnectionParams): void {
		this.handleProviderOnConnecting();
		var result = this.sqlUiController.validateConnection();
		if (result.isValid) {
			this.handleDefaultOnConnect(params, result.connection);
		} else {
			this._connectionDialog.showError('Missing required fields');
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
	}

	private handleDefaultOnConnect(params: INewConnectionParams, connection: IConnectionProfile): void {
		let uri: string = params && params.input ? params.input.uri : undefined;
		let fromEditor = params && params.connectionType === ConnectionType.editor;
		let options: IConnectionCompletionOptions = {
			params: params,
			saveToSettings: !fromEditor,
			showDashboard: !fromEditor,
			showConnectionDialogOnError: false
		};
		this._connectionManagementService.connectAndSaveProfile(connection, uri, options, params.input).then(connectionResult => {
			if (connectionResult && connectionResult.connected) {
				this._connectionDialog.close();
			} else {
				this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', connectionResult.error);
				this._connectionDialog.resetConnection();
			}
		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
			this._connectionDialog.resetConnection();
		});
	}

	private get sqlUiController(): SqlConnectionController {
		if (!this._sqlConnectionController) {
			this._sqlConnectionController = new SqlConnectionController(this._container, this._connectionManagementService, this._capabilitiesMaps['MSSQL'], {
				onSetConnectButton: (enable: boolean) => this.handleSetConnectButtonEnable(enable)
			});
		}
		return this._sqlConnectionController;
	}

	private handleSetConnectButtonEnable(enable: boolean): void {
		this._connectionDialog.connectButtonEnabled = enable;
	}

	private handleShowUiComponent(): HTMLElement {
		return this.sqlUiController.showSqlUiComponent();
	}

	private handleInitDialog(): void {
		this.sqlUiController.initDialog(this._model);
	}

	private handleFillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._connectionManagementService.addSavedPassword(connectionInfo).then(connectionWithPassword => {
			this.sqlUiController.fillInConnectionInputs(connectionWithPassword);
		});
	}

	private handleProviderOnResetConnection(): void {
		this.sqlUiController.handleResetConnection();
	}

	private handleProviderOnConnecting(): void {
		this.sqlUiController.handleOnConnecting();
	}

	private UpdateModelServerCapabilities(model: IConnectionProfile) {
		let providerName = model ? model.providerName : this._defaultProviderName;
		providerName = providerName ? providerName : this._defaultProviderName;
		if (model && !model.providerName) {
			model.providerName = providerName;
		}
		let serverCapabilities = this._capabilitiesMaps[providerName];
		this._model = new ConnectionProfile(serverCapabilities, model);
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
			if (this._defaultProviderName in this._capabilitiesMaps) {
				this.UpdateModelServerCapabilities(this._inputModel);
				// If connecting from a query editor set "save connection" to false
				if (this._params && this._params.input && this._params.connectionType === ConnectionType.editor) {
					this._model.saveProfile = false;
				}
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

		this.UpdateModelServerCapabilities(model);
		// If connecting from a query editor set "save connection" to false
		if (params && params.input && params.connectionType === ConnectionType.editor) {
			this._model.saveProfile = false;
		}

		return this.showDialogWithModel().then(() => {
			if (error && error !== '') {
				this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', error);
			}
		});
	}

	private doShowDialog(params: INewConnectionParams): TPromise<void> {
		if (!this._connectionDialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._connectionDialog = this._instantiationService.createInstance(ConnectionDialogWidget, container, {
				onCancel: () => this.handleOnCancel(this._connectionDialog.newConnectionParams),
				onConnect: () => this.handleOnConnect(this._connectionDialog.newConnectionParams),
				onShowUiComponent: () => this.handleShowUiComponent(),
				onInitDialog: () => this.handleInitDialog(),
				onFillinConnectionInputs: (connectionInfo: IConnectionProfile) => this.handleFillInConnectionInputs(connectionInfo),
				onResetConnection: () => this.handleProviderOnResetConnection()
			});
			this._connectionDialog.create(this._providerTypes, this._providerNameToDisplayNameMap[this._model.providerName]);
		}
		this._connectionDialog.newConnectionParams = params;

		return new TPromise<void>(() => {
			this._connectionDialog.open(this._connectionManagementService.getRecentConnections());
		});
	}
}
