/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionManagementService, IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import * as TaskUtilities from './taskUtilities';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { IDisasterRecoveryUiService, IRestoreDialogController } from 'sql/parts/disasterRecovery/common/interfaces';
import { IAngularEventingService } from 'sql/services/angularEventing/angularEventingService';
import { IInsightsDialogService } from 'sql/parts/insights/insightsDialogService';
import { IAdminService } from 'sql/parts/admin/common/adminService';

import { ObjectMetadata } from 'data';

import { ScriptAction } from 'sql/workbench/electron-browser/taskUtilities';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';

export class TaskAction extends Action {
	constructor(id: string, label: string, private _icon: string) {
		super(id, label);
	}

	get icon(): string {
		return this._icon;
	}
}

export interface BaseActionContext extends ITaskActionContext {
	uri?: string;
	object?: ObjectMetadata;
	connInfo?: ConnectionManagementInfo;
}

export interface ITaskActionContext {
	profile: IConnectionProfile;
}

export interface InsightActionContext extends BaseActionContext {
	insight: IInsightsConfig;
}

// --- actions
export class NewQueryAction extends TaskAction {
	public static ID = 'newQuery';
	public static LABEL = nls.localize('newQuery', 'New Query');
	public static ICON = 'file';

	constructor(
		id: string, label: string, icon: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService
	) {
		super(id, label, icon);
	}

	public run(actionContext: ITaskActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.newQuery(
				actionContext.profile,
				this._connectionManagementService,
				this._queryEditorService
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
	public static LABEL = nls.localize('scriptSelect', 'Select Top 1000');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.scriptSelect(
				actionContext.profile,
				actionContext.object,
				actionContext.uri,
				this._connectionManagementService,
				this._queryEditorService,
				this._scriptingService
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
	public static LABEL = nls.localize('editData', 'Edit Data');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.editData(
				actionContext.profile,
				actionContext.object.name,
				actionContext.object.schema,
				this._connectionManagementService,
				this._queryEditorService
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
	public static LABEL = nls.localize('scriptCreate', 'View Code');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.script(
				actionContext.profile,
				actionContext.object,
				actionContext.uri,
				this._connectionManagementService,
				this._queryEditorService,
				this._scriptingService,
				ScriptAction.ScriptCreateAction
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

export class ScriptDeleteAction extends Action {
	public static ID = 'scriptDelete';
	public static LABEL = nls.localize('scriptDelete', 'Script as Delete');

	constructor(
		id: string, label: string,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IScriptingService protected _scriptingService: IScriptingService
	) {
		super(id, label);
	}

	public run(actionContext: BaseActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.script(
				actionContext.profile,
				actionContext.object,
				actionContext.uri,
				this._connectionManagementService,
				this._queryEditorService,
				this._scriptingService,
				ScriptAction.ScriptDeleteAction
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

export class BackupAction extends TaskAction {
	public static ID = 'backup';
	public static LABEL = nls.localize('backup', 'Backup');
	public static ICON = 'backup';

	constructor(
		id: string, label: string, icon: string,
		@IDisasterRecoveryUiService protected _disasterRecoveryService: IDisasterRecoveryUiService
	) {
		super(id, label, icon);
	}

	run(actionContext: ITaskActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.showBackup(
				actionContext.profile,
				this._disasterRecoveryService,
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

export class RestoreAction extends TaskAction {
	public static ID = 'restore';
	public static LABEL = nls.localize('restore', 'Restore');
	public static ICON = 'restore';

	constructor(
		id: string, label: string, icon: string,
		@IRestoreDialogController protected _restoreService: IRestoreDialogController
	) {
		super(id, label, icon);
	}

	run(actionContext: ITaskActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.showRestore(
				actionContext.profile,
				this._restoreService
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
	public static LABEL = nls.localize('manage', 'Manage');

	constructor(
		id: string, label: string,
		@IConnectionManagementService protected _connectionManagementService: IConnectionManagementService,
		@IAngularEventingService protected _angularEventingService: IAngularEventingService
	) {
		super(id, label);
	}

	run(actionContext: BaseActionContext): TPromise<boolean> {
		let self = this;
		return new TPromise<boolean>((resolve, reject) => {
			self._connectionManagementService.connect(actionContext.profile, actionContext.uri, { showDashboard: true, saveTheConnection: false, params: undefined, showConnectionDialogOnError: false }).then(
				() => {
					self._angularEventingService.sendAngularEvent(actionContext.uri, 'database');
					resolve(true);
				},
				error => {
					resolve(error);
				}
			);
		});
	}
}

export class InsightAction extends Action {
	public static ID = 'showInsight';
	public static LABEL = nls.localize('showInsight', 'Show Insight');

	constructor(
		id: string, label: string,
		@IInsightsDialogService protected _insightsDialogService: IInsightsDialogService
	) {
		super(id, label);
	}

	run(actionContext: InsightActionContext): TPromise<boolean> {
		let self = this;
		return new TPromise<boolean>((resolve, reject) => {
			self._insightsDialogService.show(actionContext.insight, actionContext.profile);
			resolve(true);
		});
	}
}

export class NewDatabaseAction extends TaskAction {
	public static ID = 'newDatabase';
	public static LABEL = nls.localize('newDatabase', 'New Database');
	public static ICON = 'new-database';

	constructor(
		id: string, label: string, icon: string,
		@IAdminService private _adminService: IAdminService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService,
	) {
		super(id, label, icon);
	}

	run(actionContext: ITaskActionContext): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.showCreateDatabase(actionContext.profile, this._adminService, this._errorMessageService);
		});
	}
}
