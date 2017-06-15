/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IConnectionManagementService, MetadataType } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { NewQueryAction, ScriptSelectAction, EditDataAction, ScriptCreateAction,
	BackupAction, BaseActionContext } from 'sql/common/baseActions';
import { IDisasterRecoveryUiService } from 'sql/parts/disasterRecovery/common/interfaces';

import { TPromise } from 'vs/base/common/winjs.base';
import { IAction } from 'vs/base/common/actions';

export interface DashboardActionContext extends BaseActionContext {
	databasename?: string;
}

export function GetExplorerActions(type: MetadataType, isCloud: boolean, dashboardService: DashboardServiceInterface): TPromise<IAction[]> {
	let actions: IAction[] = [];

	// When context menu on database
	if (type === undefined) {
		actions.push(dashboardService.instantiationService.createInstance(DashboardNewQueryAction));
		if (!isCloud) {
			actions.push(dashboardService.instantiationService.createInstance(DashboardBackupAction));
		}
		return TPromise.as(actions);
	}

	actions.push(dashboardService.instantiationService.createInstance(DashboardScriptCreateAction));

	if (type === MetadataType.View || type === MetadataType.Table) {
		actions.push(dashboardService.instantiationService.createInstance(DashboardScriptSelectAction));
	}

	if (type === MetadataType.Table) {
		actions.push(dashboardService.instantiationService.createInstance(DashboardEditDataAction));
	}

	return TPromise.as(actions);
}

export class DashboardScriptSelectAction extends ScriptSelectAction {
	protected static ID = 'dashboard.' + ScriptSelectAction.ID;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService
	) {
		super(queryEditorService, connectionManagementService, scriptingService, DashboardScriptSelectAction.ID);
	}
}

export class DashboardEditDataAction extends EditDataAction {
	protected static ID = 'dashboard.' + EditDataAction.ID;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, DashboardEditDataAction.ID);
	}
}

export class DashboardScriptCreateAction extends ScriptCreateAction {
	protected static ID = 'dashboard.' + ScriptCreateAction.ID;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService,
		@IScriptingService protected scriptingService: IScriptingService
	) {
		super(queryEditorService, connectionManagementService, scriptingService, DashboardScriptCreateAction.ID);
	}
}

export class DashboardBackupAction extends BackupAction {
	protected static ID = 'dashboard.' + BackupAction.ID;

	constructor(
		@IDisasterRecoveryUiService protected disasterRecoveryService: IDisasterRecoveryUiService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(disasterRecoveryService, DashboardBackupAction.ID);
	}

	run(actionContext: DashboardActionContext): TPromise<boolean> {
		let self = this;
		// change database before performing action
		return new TPromise<boolean>((resolve, reject) => {
			self.connectionManagementService.changeDatabase(actionContext.uri, actionContext.databasename).then(() => {
				actionContext.connInfo = self.connectionManagementService.getConnectionInfo(actionContext.uri);
				super.run(actionContext).then((result) => {
					resolve(result);
				});
			},
			() => {
				resolve(false);
			});
		});
	}
}


export class DashboardNewQueryAction extends NewQueryAction {
	protected static ID = 'dashboard.' + NewQueryAction.ID;

	constructor(
		@IQueryEditorService protected queryEditorService: IQueryEditorService,
		@IConnectionManagementService protected connectionManagementService: IConnectionManagementService
	) {
		super(queryEditorService, connectionManagementService, DashboardNewQueryAction.ID);
	}

	run(actionContext: DashboardActionContext): TPromise<boolean> {
		let self = this;
		// change database before performing action
		return new TPromise<boolean>((resolve, reject) => {
			self.connectionManagementService.changeDatabase(actionContext.uri, actionContext.databasename).then(() => {
				actionContext.profile = self.connectionManagementService.getConnectionProfile(actionContext.uri);
				super.run(actionContext).then((result) => {
					resolve(result);
				});
			},
			() => {
				resolve(false);
			});
		});
	}
}