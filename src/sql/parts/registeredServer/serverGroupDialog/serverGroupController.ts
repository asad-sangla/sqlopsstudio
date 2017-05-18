/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { IServerGroupController } from 'sql/parts/connection/common/connectionManagement';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ServerGroupDialog } from 'sql/parts/registeredServer/serverGroupDialog/serverGroupDialog';
import { withElementById } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';

export class ServerGroupController implements IServerGroupController {
	_serviceBrand: any;

	private _container: HTMLElement;
	private _serverGroupDialog: ServerGroupDialog;

	constructor(
		@IPartService private _partService: IPartService
	) {
	}

	private handleOnAddServerGroup(): void {

	}

	public showDialog(): TPromise<void> {
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
