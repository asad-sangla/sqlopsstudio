/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'vs/base/common/actions';
import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';

import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { TaskUtilities } from 'sql/common/taskUtilities';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

import { ObjectMetadata } from 'data';

export interface BaseActionContext {
	profile?: IConnectionProfile;
	uri?: string;
	object?: ObjectMetadata;
	connInfo?: ConnectionManagementInfo;
}

export class NewQueryAction extends Action {
	protected static ID = 'newQuery';
	protected static LABEL = localize('newQuery', 'New Query');

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		private ID?: string
	) {
		super(ID || NewQueryAction.LABEL, NewQueryAction.LABEL);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.newQuery(
				actionContext.profile,
				this.connectionManagementService,
				this.queryEditorService
			).then(
				result => {
					resolve(true);
				},
				error => {
					resolve(false);
				}
			);
		});
	}
}

export class ScriptSelectAction extends Action {
	protected static ID = 'selectTop';
	protected static LABEL = localize('scriptSelect', 'Select Top 1000');

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService,
		private ID?: string
	) {
		super(ID || ScriptSelectAction.ID, ScriptSelectAction.LABEL);
	}

	public run (actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.scriptSelect(
				actionContext.profile,
				actionContext.object,
				actionContext.uri,
				this.connectionManagementService,
				this.queryEditorService,
				this.scriptingService
			).then(
				result => {
					resolve(true);
				},
				error => {
					resolve(false);
				});
		});
	}
}

export class EditDataAction extends Action {
	protected static ID = 'editData';
	protected static LABEL = localize('editData', 'Edit Data');

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		protected ID?: string
	) {
		super(ID || EditDataAction.ID, EditDataAction.LABEL);
	}

	public run (actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.editData(
				actionContext.profile,
				actionContext.object.name,
				actionContext.object.schema,
				this.connectionManagementService,
				this.queryEditorService
			).then(
				result => {
					resolve(true);
				},
				error => {
					resolve(false);
				}
			);
		});
	}
}

export class ScriptCreateAction extends Action {
	protected static ID = 'scriptCreate';
	protected static LABEL = localize('scriptCreate', 'Script Create');

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService,
		protected ID?: string
	) {
		super(ID || ScriptCreateAction.ID, ScriptCreateAction.LABEL);
	}

	public run (actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.scriptCreate(
				actionContext.profile,
				actionContext.object,
				actionContext.uri,
				this.connectionManagementService,
				this.queryEditorService,
				this.scriptingService
			).then(
				result => {
					resolve(true);
				},
				error => {
					resolve(false);
				}
			);
		});
	}
}

export class BackupAction extends Action {
	protected static ID = 'backup';
	protected static LABEL = localize('backup', 'Backup');

	constructor(
		@IDisasterRecoveryUiService protected disasterRecoveryService: IDisasterRecoveryUiService,
		protected ID?: string
	) {
		super(ID || BackupAction.ID, BackupAction.LABEL);
	}

	run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.showBackup(
				actionContext.uri,
				actionContext.connInfo,
				this.disasterRecoveryService,
			).then(
				result => {
					resolve(true);
				},
				error => {
					resolve(false);
				}
			);
		});
	}
}