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
import { TPromise } from 'vs/base/common/winjs.base';
import { ConnectionProfileGroup, IConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import Severity from 'vs/base/common/severity';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export class ServerGroupController implements IServerGroupController {
	_serviceBrand: any;

	private _container: HTMLElement;
	private _serverGroupDialog: ServerGroupDialog;
	private _connectionManagementService: IConnectionManagementService;
	private _callbacks: IServerGroupDialogCallbacks;
	private _editGroup: boolean;
	private _group: ConnectionProfileGroup;

	constructor(
		@IPartService private _partService: IPartService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	private handleOnAddServerGroup(): void {
		if (this._editGroup && this._group) {
			this._group.name = this._serverGroupDialog.groupName;
			this._group.color = this._serverGroupDialog.selectedColor;
			this._group.description = this._serverGroupDialog.groupDescription;
			this._connectionManagementService.editGroup(this._group).then(() => {
				this._serverGroupDialog.close();
			}).catch(err => {
				this._errorMessageService.showDialog(this._container, Severity.Error, 'Connection Error', err);
			});

		} else {
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
	}

	private handleOnClose(): void {
		if (this._callbacks) {
			this._callbacks.onClose();
		}
	}


	public showCreateGroupDialog(connectionManagementService: IConnectionManagementService, callbacks?: IServerGroupDialogCallbacks): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		this._editGroup = false;
		this._callbacks = callbacks ? callbacks : undefined;
		return this.openServerGroupDialog();
	}

	public showEditGroupDialog(connectionManagementService: IConnectionManagementService, group: ConnectionProfileGroup): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		this._editGroup = true;
		this._group = group;
		return this.openServerGroupDialog();
	}

	private openServerGroupDialog(): TPromise<void> {
		if (!this._serverGroupDialog) {
			this._serverGroupDialog = this._instantiationService.createInstance(ServerGroupDialog);
			this._serverGroupDialog.onCancel(() => { });
			this._serverGroupDialog.onAddServerGroup(() => this.handleOnAddServerGroup());
			this._serverGroupDialog.onCloseEvent(() => this.handleOnClose());
			this._serverGroupDialog.render();
		}

		return new TPromise<void>(() => {
			this._serverGroupDialog.open(this._editGroup, this._group);
		});
	}
}
