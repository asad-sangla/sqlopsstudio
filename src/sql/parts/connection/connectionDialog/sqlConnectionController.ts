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
import { Builder } from 'vs/base/browser/builder';

export class SqlConnectionController implements IConnectionComponentController {
	private _container: HTMLElement;
	private _connectionManagementService: IConnectionManagementService;
	private _callback: IConnectionComponentCallbacks;
	private _sqlConnectionWidget: SqlConnectionWidget;
	private _advancedController: AdvancedPropertiesController;

	constructor(container: HTMLElement, connectionManagementService: IConnectionManagementService, callback: IConnectionComponentCallbacks) {
		this._container = container;
		this._connectionManagementService = connectionManagementService;
		this._callback = callback;
		this._sqlConnectionWidget  = new SqlConnectionWidget({
			onCancel: () => this._callback.onCancel(),
			onConnect: () => this._callback.onConnect(),
			onGetConnectButton: () => this._callback.onGetConnectButton(),
			onSetConnectButton: (enable: boolean) => this._callback.onSetConnectButton(enable),
			onAdvancedProperties: () => this.handleOnAdvancedProperties(),
		});
	}

	private handleOnAdvancedProperties(): void {
		if (!this._advancedController) {
			this._advancedController = new AdvancedPropertiesController(() => this._sqlConnectionWidget.focusOnAdvancedButton());
		}
		var connectionProperties = this._connectionManagementService.getAdvancedProperties();
		if (!!connectionProperties) {
			var advancedOption = connectionProperties.filter(
				(property) => (property.specialValueType === undefined || property.specialValueType === null));
			this._advancedController.showDialog(advancedOption, this._container);
		}
	}

	public showSqlUiComponent(container: Builder): void {
		this._sqlConnectionWidget.createSqlConnectionWidget(container);
	}

	public initDialog(model: IConnectionProfile): void {
		this._sqlConnectionWidget.initDialog(model);
	}

	public validateConnection(model: IConnectionProfile): boolean {
		return this._sqlConnectionWidget.connect(model);
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile): void {
		this._sqlConnectionWidget.fillInConnectionInputs(connectionInfo);
	}
}