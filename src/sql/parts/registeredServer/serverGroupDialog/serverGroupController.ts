/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import {
	IConnectionManagementService, IErrorMessageService,
	IServerGroupController, IServerGroupDialogCallbacks
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
	private _callbacks: IServerGroupDialogCallbacks;

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
			if (this._callbacks) {
				this._callbacks.onAddGroup(this._serverGroupDialog.groupName);
			}
			this._serverGroupDialog.close();
		}).catch(err => {
			this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
		});

	}

	private handleOnClose(): void {
		if (this._callbacks) {
			this._callbacks.onClose();
		}
	}

	public showDialog(connectionManagementService: IConnectionManagementService, callbacks?: IServerGroupDialogCallbacks): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		this._callbacks = callbacks ? callbacks : undefined;
		if (!this._serverGroupDialog) {
			let container = withElementById(this._partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this._container = container;
			this._serverGroupDialog = new ServerGroupDialog(container, {
				onCancel: () => { },
				onAddServerGroup: () => this.handleOnAddServerGroup(),
				onClose: () => this.handleOnClose()
			});
			this._serverGroupDialog.create();
		}

		return new TPromise<void>(() => {
			this._serverGroupDialog.open();
		});
	}
}
