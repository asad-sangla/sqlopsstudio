/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionComponentCallbacks, IConnectionComponentController, IConnectionResult } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { ConnectionWidget } from 'sql/parts/connection/connectionDialog/connectionWidget';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import data = require('data');

export class ConnectionController implements IConnectionComponentController {
	private _container: HTMLElement;
	private _connectionManagementService: IConnectionManagementService;
	private _callback: IConnectionComponentCallbacks;
	private _connectionWidget: ConnectionWidget;
	private _advancedController: AdvancedPropertiesController;
	private _model: IConnectionProfile;
	private _providerOptions: data.ConnectionOption[];
	private _providerName: string;

	constructor(container: HTMLElement, connectionManagementService: IConnectionManagementService, sqlCapabilities: data.DataProtocolServerCapabilities, callback: IConnectionComponentCallbacks, providerName: string) {
		this._container = container;
		this._connectionManagementService = connectionManagementService;
		this._callback = callback;
		this._providerOptions = sqlCapabilities.connectionProvider.options;
		var specialOptions = this._providerOptions.filter(
			(property) => (property.specialValueType !== null && property.specialValueType !== undefined));
		this._connectionWidget = new ConnectionWidget(specialOptions, {
			onSetConnectButton: (enable: boolean) => this._callback.onSetConnectButton(enable),
			onAdvancedProperties: () => this.handleOnAdvancedProperties(),
			onSetAzureTimeOut: () => this.handleonSetAzureTimeOut()
		}, providerName);
		this._providerName = providerName;
	}

	private handleonSetAzureTimeOut(): void {
		var timeoutPropertyName = 'connectTimeout';
		var timeoutOption = this._model.options[timeoutPropertyName];
		if (timeoutOption === undefined || timeoutOption === null) {
			this._model.options[timeoutPropertyName] = 30;
		}
	}

	private handleOnAdvancedProperties(): void {
		if (!this._advancedController) {
			this._advancedController = new AdvancedPropertiesController(() => this._connectionWidget.focusOnAdvancedButton());
		}
		var advancedOption = this._providerOptions.filter(
			(property) => (property.specialValueType === undefined || property.specialValueType === null));
		this._advancedController.showDialog(advancedOption, this._container, this._model.options);
	}

	public showUiComponent(): HTMLElement {
		return this._connectionWidget.createConnectionWidget();
	}

	public initDialog(connectionInfo: IConnectionProfile): void {
		this._model = connectionInfo;
		this._model.providerName = this._providerName;
		this._model.options['applicationName'] = 'carbon';
		this._connectionWidget.initDialog(this._model);
	}

	public validateConnection(): IConnectionResult {
		return { isValid: this._connectionWidget.connect(this._model), connection: this._model };
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._model = connectionInfo;
		this._connectionWidget.fillInConnectionInputs(connectionInfo);
	}

	public handleOnConnecting(): void {
		this._connectionWidget.handleOnConnecting();
	}

	public handleResetConnection(): void {
		this._connectionWidget.handleResetConnection();
	}
}