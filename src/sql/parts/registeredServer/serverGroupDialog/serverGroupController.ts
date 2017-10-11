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
import { ServerGroupViewModel } from 'sql/parts/registeredServer/serverGroupDialog/serverGroupViewModel';
import { TPromise } from 'vs/base/common/winjs.base';
import { ConnectionProfileGroup, IConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import Severity from 'vs/base/common/severity';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { SERVER_GROUP_CONFIG, SERVER_GROUP_COLORS_CONFIG } from './serverGroup.contribution';

export class ServerGroupController implements IServerGroupController {
	_serviceBrand: any;

	private _serverGroupDialog: ServerGroupDialog;
	private _connectionManagementService: IConnectionManagementService;
	private _callbacks: IServerGroupDialogCallbacks;
	private _group: ConnectionProfileGroup;
	private _viewModel: ServerGroupViewModel;

	constructor(
		@IPartService private _partService: IPartService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IConfigurationService private _configurationService: IConfigurationService
	) {
	}

	private handleOnAddServerGroup(): void {
		if (this._group) {
			let tempGroup: ConnectionProfileGroup = this.copyConnectionProfileGroup(this._group);
			this._group.name = this._viewModel.groupName;
			this._group.color = this._viewModel.groupColor;
			this._group.description = this._viewModel.groupDescription;
			this._connectionManagementService.editGroup(this._group).then(() => {
				this._serverGroupDialog.close();
			}).catch(err => {
				// rollback changes made
				this._group = tempGroup;
				this._errorMessageService.showDialog(Severity.Error, 'Connection Error', err);
			});

		} else {
			let newGroup: IConnectionProfileGroup = {
				name: this._viewModel.groupName,
				id: undefined,
				parentId: undefined,
				color: this._viewModel.groupColor,
				description: this._viewModel.groupDescription
			};
			this._connectionManagementService.saveProfileGroup(newGroup).then(groupId => {
				if (this._callbacks) {
					this._callbacks.onAddGroup(this._serverGroupDialog.groupName);
				}
				this._serverGroupDialog.close();
			}).catch(err => {
				this._errorMessageService.showDialog(Severity.Error, 'Connection Error', err);
			});
		}
	}

	private copyConnectionProfileGroup(group: ConnectionProfileGroup): ConnectionProfileGroup {
		return new ConnectionProfileGroup(group.name, group.parent, group.id, group.color, group.description);
	}

	private handleOnClose(): void {
		if (this._callbacks) {
			this._callbacks.onClose();
		}
	}


	public showCreateGroupDialog(connectionManagementService: IConnectionManagementService, callbacks?: IServerGroupDialogCallbacks): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		this._group = null;
		this._viewModel = new ServerGroupViewModel(undefined, this._configurationService.getConfiguration(SERVER_GROUP_CONFIG)[SERVER_GROUP_COLORS_CONFIG]);
		this._callbacks = callbacks ? callbacks : undefined;
		return this.openServerGroupDialog();
	}

	public showEditGroupDialog(connectionManagementService: IConnectionManagementService, group: ConnectionProfileGroup): TPromise<void> {
		this._connectionManagementService = connectionManagementService;
		this._group = group;
		this._viewModel = new ServerGroupViewModel(group, this._configurationService.getConfiguration(SERVER_GROUP_CONFIG)[SERVER_GROUP_COLORS_CONFIG]);
		return this.openServerGroupDialog();
	}

	private openServerGroupDialog(): TPromise<void> {
		if (!this._serverGroupDialog) {
			this._serverGroupDialog = this._instantiationService.createInstance(ServerGroupDialog);
			this._serverGroupDialog.viewModel = this._viewModel;
			this._serverGroupDialog.onCancel(() => { });
			this._serverGroupDialog.onAddServerGroup(() => this.handleOnAddServerGroup());
			this._serverGroupDialog.onCloseEvent(() => this.handleOnClose());
			this._serverGroupDialog.render();
		} else {
			// reset the view model in the view
			this._serverGroupDialog.viewModel = this._viewModel;
		}

		return new TPromise<void>(() => {
			this._serverGroupDialog.open();
		});
	}
}
