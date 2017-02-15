/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService, IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';

export class ConnectionDialogService implements IConnectionDialogService {

    _serviceBrand: any;

	private _connectionManagementService: IConnectionManagementService;

	constructor(
		@IPartService private partService: IPartService
	) {
	}

	private connectionDialog: ConnectionDialogWidget;

	private handleOnConnect(): void {
		this._connectionManagementService.addConnectionProfile(this.connectionDialog.getConnection());
	}

	public showDialog(connectionManagementService: IConnectionManagementService): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		return new TPromise<void>(() => {
			this.doShowDialog();
		});
	}

	private doShowDialog(): TPromise<void> {
		if(!this.connectionDialog) {
			let container = withElementById(this.partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this.connectionDialog  = new ConnectionDialogWidget(container, {
				onCancel: () => {},
				onConnect: () => this.handleOnConnect()
			});
			this.connectionDialog.create();
		}

		return new TPromise<void>(() => {
			//this.dialog.setModel(model);
			this.connectionDialog.open();
		});
	}
}
