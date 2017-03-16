/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService, IConnectionManagementService, IErrorMessageService,
	ConnectionType, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { Builder, withElementById } from 'vs/base/browser/builder';
import { SqlConnectionController } from 'sql/parts/connection/connectionDialog/sqlConnectionController';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Severity from 'vs/base/common/severity';

export interface IConnectionComponentCallbacks {
	onConnect: () => void;
	onCancel: () => void;
	onGetConnectButton: () => boolean;
	onSetConnectButton: (enable: boolean) => void;
	onAdvancedProperties?: () => void;
}

export interface IConnectionComponentController {
	showSqlUiComponent(container: Builder): void;
	initDialog(model: IConnectionProfile): void;
	validateConnection(model: IConnectionProfile): boolean;
	fillInConnectionInputs(connectionInfo: IConnectionProfile): void;
}

export class ConnectionDialogService implements IConnectionDialogService {

	_serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;
	private _container: HTMLElement;
	private _connectionDialog: ConnectionDialogWidget;
	private _sqlConnectionController: SqlConnectionController;
	private _model: IConnectionProfile;

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
	}

	private handleOnConnect(params: INewConnectionParams): void {
		if(this.sqlUiController.validateConnection(this._model)) {
			if (params && params.connectionType === ConnectionType.default) {
				this.handleDefaultOnConnect();
			} else if (params && params.editor && params.uri && params.connectionType === ConnectionType.queryEditor) {
				this.handleQueryEditorOnConnect(params);
			}
		} else {
			this._connectionDialog.showError('Missing required fields');
		}
	}

	private handleOnCancel(params: INewConnectionParams): void {
		if (params && params.editor && params.uri && params.connectionType === ConnectionType.queryEditor) {
			params.editor.onConnectReject();
		}
	}

	private handleDefaultOnConnect(): void {
		this._connectionManagementService.addConnectionProfile(this._model).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}
		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
		});
	}

	private handleQueryEditorOnConnect(params: INewConnectionParams): void {
		this._connectionManagementService.connectEditor(params.editor, params.uri, params.runQueryOnCompletion, this._model).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}

		}).catch(err => {
			this._connectionDialog.showError(err);
		});
	}

	private get sqlUiController(): SqlConnectionController {
		if (!this._sqlConnectionController) {
			this._sqlConnectionController = new SqlConnectionController(this._container, this._connectionManagementService, {
				onCancel: () => this.handleOnCancel(this._connectionDialog.newConnectionParams),
				onConnect: () => this.handleOnConnect(this._connectionDialog.newConnectionParams),
				onGetConnectButton: () => this.handleGetConnectButtonEnable(),
				onSetConnectButton: (enable: boolean) => this.handleSetConnectButtonEnable(enable)
			});
		}
		return this._sqlConnectionController;
	}

	private handleGetConnectButtonEnable(): boolean {
		return this._connectionDialog.connectButtonEnabled;
	}

	private handleSetConnectButtonEnable(enable: boolean): void {
		this._connectionDialog.connectButtonEnabled = enable;
	}

	private handleShowUiComponent(container: Builder): void {
		this.sqlUiController.showSqlUiComponent(container);
	}

	private handleInitDialog(): void {
		this.sqlUiController.initDialog(this._model);
	}

	private handleFillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this.sqlUiController.fillInConnectionInputs(connectionInfo);
	}

	public showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model?: IConnectionProfile): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		let capabilities = this._capabilitiesService.getCapabilities();
		//For now harcoding to mssql only. The dialog has to show all the providers
		//and create the connection profile for that provider
		let sqlCapabilities = capabilities.find(c => c.providerName === 'MSSQL');
		this._model = new ConnectionProfile(sqlCapabilities, model);

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
				onShowUiComponent: (container: Builder) => this.handleShowUiComponent(container),
				onInitDialog: () => this.handleInitDialog(),
				onFillinConnectionInputs: (connectionInfo: IConnectionProfile) => this.handleFillInConnectionInputs(connectionInfo)
			});
			this._connectionDialog.create();
		}
		this._connectionDialog.newConnectionParams = params;

		return new TPromise<void>(() => {
			this._connectionDialog.open(this._connectionManagementService.getRecentConnections());
			this._connectionDialog.initDialog();
		});
	}
}
