/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import {
	IConnectionManagementService, IErrorMessageService,
	IServerGroupController
} from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ServerGroupDialog } from 'sql/parts/registeredServer/serverGroupDialog/serverGroupDialog';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import Severity from 'vs/base/common/severity';

export class ServerGroupController implements IServerGroupController {
	_serviceBrand: any;

	private _container: HTMLElement;
	private _serverGroupDialog: ServerGroupDialog;
	private _connectionManagementService: IConnectionManagementService;

	constructor(
		@IPartService private _partService: IPartService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
	}

	private handleOnAddServerGroup(): void {
		let newGroup: IConnectionProfileGroup = {
			name: this._serverGroupDialog.groupName,
			id: undefined,
			parentId: undefined,
			color: this._serverGroupDialog.selectedColor,
			description: this._serverGroupDialog.groupDescription
		};
		this._connectionManagementService.saveProfileGroup(newGroup).then(groupId => {
			this._serverGroupDialog.close();
		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
		});

	}

	public showDialog(connectionManagementService: IConnectionManagementService): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		if (!this._serverGroupDialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._serverGroupDialog = new ServerGroupDialog(container, {
				onCancel: () => { },
				onAddServerGroup: () => this.handleOnAddServerGroup(),
			});
			this._serverGroupDialog.create();
		}

		return new TPromise<void>(() => {
			this._serverGroupDialog.open();
		});
	}
}
