/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionComponentCallbacks, IConnectionComponentController } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { SqlConnectionWidget } from 'sql/parts/connection/connectionDialog/sqlConnectionWidget';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import data = require('data');

export class SqlConnectionController implements IConnectionComponentController {
	private _container: HTMLElement;
	private _connectionManagementService: IConnectionManagementService;
	private _callback: IConnectionComponentCallbacks;
	private _sqlConnectionWidget: SqlConnectionWidget;
	private _advancedController: AdvancedPropertiesController;
	private _model: ConnectionProfile;

	constructor(container: HTMLElement, connectionManagementService: IConnectionManagementService, sqlCapabilities: data.DataProtocolServerCapabilities, callback: IConnectionComponentCallbacks) {
		this._container = container;
		this._connectionManagementService = connectionManagementService;
		this._callback = callback;
		var options: data.ConnectionOption[] = sqlCapabilities.connectionProvider.options;
		var specialOptions = options.filter(
			(property) => (property.specialValueType !== null && property.specialValueType !== undefined));
		this._sqlConnectionWidget = new SqlConnectionWidget(specialOptions, {
			onSetConnectButton: (enable: boolean) => this._callback.onSetConnectButton(enable),
			onAdvancedProperties: () => this.handleOnAdvancedProperties(),
		});
	}

	private handleOnAdvancedProperties(): void {
		if (!this._advancedController) {
			this._advancedController = new AdvancedPropertiesController(() => this._sqlConnectionWidget.focusOnAdvancedButton());
		}
		var connectionProperties = this._model.getProviderOptions();
		if (!!connectionProperties) {
			var advancedOption = connectionProperties.filter(
				(property) => (property.specialValueType === undefined || property.specialValueType === null));
			this._advancedController.showDialog(advancedOption, this._container, this._model.options);
		}
	}

	public showSqlUiComponent(): HTMLElement {
		return this._sqlConnectionWidget.createSqlConnectionWidget();
	}

	public initDialog(model: ConnectionProfile): void {
		this._model = model;
		this._model.setOptionValue('applicationName', 'carbon');
		this._sqlConnectionWidget.initDialog(this._model);
	}

	public validateConnection(model: IConnectionProfile): boolean {
		return this._sqlConnectionWidget.connect(model);
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._sqlConnectionWidget.fillInConnectionInputs(connectionInfo);
	}
}