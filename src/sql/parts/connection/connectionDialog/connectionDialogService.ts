/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService, IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

export class ConnectionDialogService implements IConnectionDialogService {

	_serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;

	private _container: HTMLElement;

	constructor(
		@IPartService private partService: IPartService
	) {
	}

	private _connectionDialog: ConnectionDialogWidget;
	private _advancedcontroller: AdvancedPropertiesController;

	private handleOnConnect(): void {
		this._connectionManagementService.addConnectionProfile(this._connectionDialog.getConnection()).then(connected => {
			if (connected) {
				this._connectionDialog.close();
			}

		}).catch(err => {
			this._connectionDialog.showError(err);
		});
	}

	private handleOnAdvancedProperties(): void {
		if (!this._advancedcontroller) {
			this._advancedcontroller = new AdvancedPropertiesController();
		}
		var connectionProperties = this._connectionManagementService.getAdvancedProperties();
		this._advancedcontroller.showDialog(connectionProperties, this._container);
	}

	public showDialog(connectionManagementService: IConnectionManagementService, model?: IConnectionProfile): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		return new TPromise<void>(() => {
			this.doShowDialog(model);
		});
	}

	private doShowDialog(model?: IConnectionProfile): TPromise<void> {
		if (!this._connectionDialog) {
			let container = withElementById(this.partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._connectionDialog = new ConnectionDialogWidget(container, {
				onCancel: () => { },
				onConnect: () => this.handleOnConnect(),
				onAdvancedProperties: () => this.handleOnAdvancedProperties()
			});
			this._connectionDialog.create();
		}

		return new TPromise<void>(() => {
			model = model !== undefined ? model : {
				serverName: '',
				authenticationType: '',
				databaseName: '',
				groupName: '',
				userName: '',
				password: '',
				savePassword: false,
				groupId: undefined
			};
			this._connectionDialog.open(this._connectionManagementService.getRecentConnections());
			this._connectionDialog.setConnection(model);
		});
	}
}
