/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import {
	IConnectionDialogService, IConnectionManagementService, IErrorMessageService,
	ConnectionType, INewConnectionParams
} from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { withElementById } from 'vs/base/browser/builder';
import { SqlConnectionController } from 'sql/parts/connection/connectionDialog/sqlConnectionController';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';
import data = require('data');

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
	private _capabilitiesMaps: { [providerDisplayName: string]: data.DataProtocolServerCapabilities };
	private _providerNameToDisplayNameMap: { [providerDisplayName: string]: string };
	private _providerTypes: string[];

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
		this._capabilitiesMaps = {};
		this._providerNameToDisplayNameMap = {};
		this._providerTypes = [];
	}

	private handleOnConnect(params: INewConnectionParams): void {
		this.handleProviderOnConnecting();
		var result = this.sqlUiController.validateConnection();
		if(result.isValid) {
			if (params && params.connectionType === ConnectionType.default) {
				this.handleDefaultOnConnect(result.connection);
			} else if (params && params.input && params.connectionType === ConnectionType.queryEditor) {
				if (params.disconnectExistingConnection) {
					this.handleQueryEditorOnChangeConnection(params, result.connection);
				} else {
					this.handleQueryEditorOnConnect(params, result.connection);
				}
			}
		} else {
			this._connectionDialog.showError('Missing required fields');
		}
	}

	private handleOnCancel(params: INewConnectionParams): void {
		if (params && params.input && params.connectionType === ConnectionType.queryEditor) {
			params.input.onConnectReject();
		}
		this._connectionDialog.resetConnection();
	}

	private handleDefaultOnConnect(connection: IConnectionProfile): void {
		this._connectionManagementService.addConnectionProfile(connection).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}
		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
			this._connectionDialog.resetConnection();
		});
	}

	private handleQueryEditorOnConnect(params: INewConnectionParams, connection: IConnectionProfile): void {
		this._connectionManagementService.connectEditor(params.input, params.runQueryOnCompletion, connection).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}

		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
			this._connectionDialog.resetConnection();
		});
	}

	private handleQueryEditorOnChangeConnection(params: INewConnectionParams, connection: IConnectionProfile): void {
		this._connectionManagementService.disconnectEditor(params.input, true)
			.then(disconnected => {
				if (disconnected) {
					return this._connectionManagementService.connectEditor(params.input, params.runQueryOnCompletion, connection);
				}
				return false;
			})
			.then(connected => {
				if (connected) {
					this._connectionDialog.close();
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
		this.sqlUiController.fillInConnectionInputs(connectionInfo);
	}

	private handleProviderOnResetConnection(): void {
		this.sqlUiController.handleResetConnection();
	}

	private handleProviderOnConnecting(): void {
		this.sqlUiController.handleOnConnecting();
	}

	private UpdateModelServerCapabilities(model: IConnectionProfile, providerName: string) {
		let serverCapabilities = this._capabilitiesMaps[providerName];
		this._model = new ConnectionProfile(serverCapabilities, model);
	}

	public showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model?: IConnectionProfile): TPromise<void> {
		this._connectionManagementService = connectionManagementService;

		// only create the provider maps first time the dialog gets called
		if (this._providerTypes.length === 0) {
			let capabilities = this._capabilitiesService.getCapabilities();
			capabilities.forEach(c => {
				this._providerTypes.push(c.providerDisplayName);
				this._capabilitiesMaps[c.providerName] = c;
				this._providerNameToDisplayNameMap[c.providerName] = c.providerDisplayName;
			});
		}

		this.UpdateModelServerCapabilities(model, model ? model.providerName : 'MSSQL');

		return new TPromise<void>(() => {
			this.doShowDialog(params);
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
