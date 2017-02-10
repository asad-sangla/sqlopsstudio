/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionDialogService } from 'sql/parts/connection/common/registeredServers';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { withElementById } from 'vs/base/browser/builder';

export class ConnectionDialogService implements IConnectionDialogService {

    _serviceBrand: any;

	constructor(
		@IPartService private partService: IPartService
	) {

	}

	private dialog: ConnectionDialogWidget;

	public open(): void {
		if(!this.dialog){
			this.dialog  = new ConnectionDialogWidget();
			let container = withElementById(this.partService.getWorkbenchElementId()).getHTMLElement().parentElement;
			this.dialog.create(container);
		}

		this.dialog.open();
	}
}