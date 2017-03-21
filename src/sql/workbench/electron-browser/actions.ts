/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IQuickOpenService } from 'vs/platform/quickOpen/common/quickOpen';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import nls = require('vs/nls');


// --- actions

export class EditDataAction extends Action {
	public static ID = 'registeredServers.editData';
	public static LABEL = nls.localize('editData', 'Edit Data');

	constructor(
		id: string,
		label: string,
		@IQuickOpenService private quickOpenService: IQuickOpenService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IQueryEditorService private queryEditorService: IQueryEditorService,
		@IQueryModelService private queryModelService: IQueryModelService
	) {
		super(id, label);
	}

	public run(connectionProfile?: ConnectionProfile): TPromise<boolean> {
		// ask for a table within the element connectionProfile
		let tableRequest = (con: ConnectionProfile) => {
			return this.quickOpenService.input(
				{
						placeHolder: nls.localize('tableName', 'table name')
				})
			.then((tableName) => {
				if(tableName) {
					// open an edit data session on that table
					this.queryEditorService.newEditDataEditor(tableName).then((owner: EditDataInput) => {
						// Connect our editor
						this.connectionManagementService.connectEditor(owner, true, connectionProfile);
					});
				}
			});
		};

		if (!connectionProfile) {
			// creating a flat map of connections (ungrouping them)
			let connectionList: ConnectionProfile[] = [];
			this.connectionManagementService.getConnectionGroups()
				.map(group => group.connections
				.map(con => connectionList.push(con)));

			let conIds = connectionList.map(x => x.id);

			// select a connection from the drop down
			this.quickOpenService.pick(conIds, {placeHolder: nls.localize('connectionProfile','connection profile'), ignoreFocusLost: true}).then((connection) => {
				// get connection
				let conProfile: ConnectionProfile = connectionList.find(x => x.id === connection);
				if (conProfile) {
					// making sure a table name was returned, otherwise we will ask once more
					tableRequest(conProfile).then(tableName => {
						if(!tableName) {
							tableRequest(conProfile);
						}
					});
				}
			});

		} else {
			tableRequest(connectionProfile);
		}

		return TPromise.as(true);
	}
}