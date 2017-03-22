/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionComponentCallbacks, IConnectionComponentController, IConnectionResult } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { SqlConnectionWidget } from 'sql/parts/connection/connectionDialog/sqlConnectionWidget';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import data = require('data');

export class SqlConnectionController implements IConnectionComponentController {
	private _container: HTMLElement;
	private _connectionManagementService: IConnectionManagementService;
	private _callback: IConnectionComponentCallbacks;
	private _sqlConnectionWidget: SqlConnectionWidget;
	private _advancedController: AdvancedPropertiesController;
	private _model: IConnectionProfile;
	private _providerOptions: data.ConnectionOption[];

	constructor(container: HTMLElement, connectionManagementService: IConnectionManagementService, sqlCapabilities: data.DataProtocolServerCapabilities, callback: IConnectionComponentCallbacks) {
		this._container = container;
		this._connectionManagementService = connectionManagementService;
		this._callback = callback;
		this._providerOptions = sqlCapabilities.connectionProvider.options;
		var specialOptions = this._providerOptions.filter(
			(property) => (property.specialValueType !== null && property.specialValueType !== undefined));
		this._sqlConnectionWidget = new SqlConnectionWidget(specialOptions, {
			onSetConnectButton: (enable: boolean) => this._callback.onSetConnectButton(enable),
			onAdvancedProperties: () => this.handleOnAdvancedProperties(),
			onSetAzureTimeOut: () => this.handleonSetAzureTimeOut()
		});
	}

	private handleonSetAzureTimeOut(): void {
		var timeoutPropertyName = 'connectTimeout';
		var timeoutOption = this._model.options[timeoutPropertyName];
		if (timeoutOption === undefined || timeoutOption === null) {
			this._model.options[timeoutPropertyName] = 30;
		}

		if (this._advancedController) {
			this._advancedController.updateAdvancedOption(this._model.options);
		}
	}

	private handleOnAdvancedProperties(): void {
		if (!this._advancedController) {
			this._advancedController = new AdvancedPropertiesController(() => this._sqlConnectionWidget.focusOnAdvancedButton());
		}
		var advancedOption = this._providerOptions.filter(
			(property) => (property.specialValueType === undefined || property.specialValueType === null));
		this._advancedController.showDialog(advancedOption, this._container, this._model.options);
	}

	public showSqlUiComponent(): HTMLElement {
		return this._sqlConnectionWidget.createSqlConnectionWidget();
	}

	public initDialog(connectionInfo: IConnectionProfile): void {
		this._model = connectionInfo;
		this._model.options['applicationName'] = 'carbon';
		this._sqlConnectionWidget.initDialog(this._model);
	}

	public validateConnection(): IConnectionResult {
		return {isValid: this._sqlConnectionWidget.connect(this._model), connection: this._model };
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._model = connectionInfo;
		this._sqlConnectionWidget.fillInConnectionInputs(connectionInfo);
		if (this._advancedController) {
			this._advancedController.updateAdvancedOption(this._model.options);
		}
	}

	public handleOnConnecting(): void {
		this._sqlConnectionWidget.handleOnConnecting();
	}

	public handleResetConnection(): void {
		this._sqlConnectionWidget.handleResetConnection();
	}
}