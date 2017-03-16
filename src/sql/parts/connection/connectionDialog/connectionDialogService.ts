/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService, IConnectionManagementService, IErrorMessageService,
	ConnectionType, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import Severity from 'vs/base/common/severity';

export class ConnectionDialogService implements IConnectionDialogService {

	_serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;

	private _container: HTMLElement;

	constructor(
		@IPartService private _partService: IPartService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
	}

	private _connectionDialog: ConnectionDialogWidget;
	private _advancedController: AdvancedPropertiesController;

	private handleOnConnect(params: INewConnectionParams): void {
		if (params && params.connectionType === ConnectionType.default) {
			this.handleDefaultOnConnect();
		} else if (params && params.editor && params.uri && params.connectionType === ConnectionType.queryEditor) {
			this.handleQueryEditorOnConnect(params);
		}
	}

	private handleOnCancel(params: INewConnectionParams): void {
		if (params && params.editor && params.uri && params.connectionType === ConnectionType.queryEditor) {
			params.editor.onConnectReject();
		}
	}

	private handleDefaultOnConnect(): void {
		this._connectionManagementService.addConnectionProfile(this._connectionDialog.getConnection()).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}

		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
		});
	}

	private handleQueryEditorOnConnect(params: INewConnectionParams): void {
		this._connectionManagementService.connectEditor(params.editor, params.uri, params.runQueryOnCompletion, this._connectionDialog.getConnection()).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}

		}).catch(err => {
			this._connectionDialog.showError(err);
		});
	}


	private handleOnAdvancedProperties(): void {
		if (!this._advancedController) {
			this._advancedController = new AdvancedPropertiesController(() => this._connectionDialog.focusOnAdvancedButton());
		}
		var connectionProperties = this._connectionManagementService.getAdvancedProperties();
		if (!!connectionProperties) {
			var advancedOption = connectionProperties.filter(
				(property) => (property.specialValueType === undefined || property.specialValueType === null));
			this._advancedController.showDialog(advancedOption, this._container);
		}
	}

	public showDialog(connectionManagementService: IConnectionManagementService, params: INewConnectionParams, model?: IConnectionProfile): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		let capabilities = this._capabilitiesService.getCapabilities();
		//For now harcoding to mssql only. The dialog has to show all the providers
		//and create the connection profile for that provider
		let sqlCapabilities = capabilities.find(c => c.providerName === 'MSSQL');
		let connectionProfile: ConnectionProfile = new ConnectionProfile(sqlCapabilities, model);

		return new TPromise<void>(() => {
			this.doShowDialog(params, connectionProfile);
		});
	}

	private doShowDialog(params: INewConnectionParams, model?: IConnectionProfile): TPromise<void> {
		if (!this._connectionDialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._connectionDialog = this._instantiationService.createInstance(ConnectionDialogWidget, container, {
				onCancel: () => this.handleOnCancel(this._connectionDialog.newConnectionParams),
				onConnect: () => this.handleOnConnect(this._connectionDialog.newConnectionParams),
				onAdvancedProperties: () => this.handleOnAdvancedProperties(),
			});
			this._connectionDialog.create();
		}
		this._connectionDialog.newConnectionParams = params;

		return new TPromise<void>(() => {
			this._connectionDialog.open(this._connectionManagementService.getRecentConnections());
			this._connectionDialog.setConnection(model);
		});
	}
}
