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
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { IAngularEventingService } from 'sql/services/angularEventing/angularEventingService';

import { ObjectMetadata } from 'data';

export interface BaseActionContext {
	profile?: IConnectionProfile;
	uri?: string;
	object?: ObjectMetadata;
	connInfo?: ConnectionManagementInfo;
}

export class NewQueryAction extends Action {
	public static ID = 'newQuery';
	public static LABEL = localize('newQuery', 'New Query');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
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
	public static ID = 'selectTop';
	public static LABEL = localize('scriptSelect', 'Select Top 1000');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
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
	public static ID = 'editData';
	public static LABEL = localize('editData', 'Edit Data');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
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
	public static ID = 'scriptCreate';
	public static LABEL = localize('scriptCreate', 'Script Create');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
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
	public static ID = 'backup';
	public static LABEL = localize('backup', 'Backup');

	constructor(
		id: string, label: string,
		@IDisasterRecoveryUiService protected disasterRecoveryService: IDisasterRecoveryUiService
	) {
		super(id, label);
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

export class ManageAction extends Action {
	public static ID = 'manage';
	public static LABEL = localize('manage', 'Manage');

	constructor(
		id: string, label: string,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IBootstrapService protected bootstrapService: IBootstrapService,
		@IAngularEventingService protected angularEventingService: IAngularEventingService
	) {
		super(id, label);
	}

	run(actionContext: BaseActionContext): TPromise<boolean> {
		let self = this;
		return new TPromise<boolean>((resolve, reject) => {
			self.connectionManagementService.connect(actionContext.profile, actionContext.uri, {showDashboard: true, saveTheConnection: false, params: undefined, showConnectionDialogOnError: false}).then(() => {
				self.angularEventingService.sendAngularEvent(actionContext.uri, 'database');
				resolve(true);
			},
			() => {
				resolve(false);
			});
		});
	}
}