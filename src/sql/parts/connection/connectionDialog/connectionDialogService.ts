/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService, IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { withElementById } from 'vs/base/browser/builder';
import { ConnectionDialogModel } from './connectionDialogModel';
import * as vscode from 'vscode';

export class ConnectionDialogService implements IConnectionDialogService {

    _serviceBrand: any;

	private _registeredServersService: IRegisteredServersService;

	constructor(
		@IPartService private partService: IPartService
	) {
	}

	private dialog: ConnectionDialogWidget;

	private handleOnConnect(): void {
		alert(this.dialog.getModel().toString());

		let model: ConnectionDialogModel = this.dialog.getModel();
		let connInfo: vscode.ConnectionInfo = {
			serverName: model.serverName,
			databaseName: model.databaseName,
			userName: model.userName,
			password: model.password
		};

		this._registeredServersService.addRegisteredServer(connInfo);
	}

	public open(registeredServersService: IRegisteredServersService): void {
		this._registeredServersService = registeredServersService;

		let model: ConnectionDialogModel = new ConnectionDialogModel(
			'server name',
			'database name',
			'user name',
			'password'
		);

		if(!this.dialog) {
			let container = withElementById(this.partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this.dialog  = new ConnectionDialogWidget(container, {
				onCancel: () => {},
				onConnect: () => this.handleOnConnect()
			});
			this.dialog.create();

		}

		this.dialog.setModel(model);
		this.dialog.open();
	}
}
