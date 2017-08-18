/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import {
	IConnectableInput, IConnectionManagementService,
	IConnectionCompletionOptions, ConnectionType, IErrorMessageService,
	RunQueryOnConnectionMode
} from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryUiService, IRestoreDialogController } from 'sql/parts/disasterRecovery/common/interfaces';
import { IInsightsConfig } from 'sql/parts/dashboard/widgets/insights/interfaces';
import { IInsightsDialogService } from 'sql/parts/insights/insightsDialogService';
import Severity from 'vs/base/common/severity';
import data = require('data');
import nls = require('vs/nls');

export enum ScriptAction {
	ScriptCreateAction,
	ScriptDeleteAction,
	ScriptSelectAction
}

export function connectIfNotAlreadyConnected(connectionProfile: IConnectionProfile, connectionService: IConnectionManagementService): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let uri = connectionService.getConnectionId(connectionProfile);
		if (!connectionService.isConnected(uri)) {
			let options: IConnectionCompletionOptions = {
				params: { connectionType: ConnectionType.editor, runQueryOnCompletion: RunQueryOnConnectionMode.executeQuery, input: undefined },
				saveTheConnection: false,
				showDashboard: false,
				showConnectionDialogOnError: false
			};
			connectionService.connect(connectionProfile, uri, options).then(() => {
				setTimeout(function () {
					resolve();
				}, 2000);
			}).catch(connectionError => {
				reject(connectionError);
			});
		} else {
			resolve();
		}
	});
}

/**
 * Select the top rows from an object
 */
export function scriptSelect(connectionProfile: IConnectionProfile, metadata: data.ObjectMetadata, ownerUri: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService, scriptingService: IScriptingService): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		connectIfNotAlreadyConnected(connectionProfile, connectionService).then(connectionResult => {
			scriptingService.script(ownerUri, metadata, ScriptAction.ScriptSelectAction).then(result => {
				if (result && result.script) {
					queryEditorService.newSqlEditor(result.script).then((owner: IConnectableInput) => {
						// Connect our editor to the input connection
						let options: IConnectionCompletionOptions = {
							params: { connectionType: ConnectionType.editor, runQueryOnCompletion: RunQueryOnConnectionMode.executeQuery, input: owner },
							saveTheConnection: false,
							showDashboard: false,
							showConnectionDialogOnError: true
						};
						connectionService.connect(connectionProfile, owner.uri, options).then(() => {
							resolve();
						});
					}).catch(edirotError => {
						reject(edirotError);
					});
				} else {
					let errMsg = nls.localize("scriptNotFound", "No script was returned when calling script {action} on object {metadata.metadataTypeName}");
					reject(errMsg);
				}
			}, scriptError => {
				reject(scriptError);
			});
		}).catch(connectionError => {
			reject(connectionError);
		});
	});
}

/**
 * Opens a new Edit Data session
 */
export function editData(connectionProfile: IConnectionProfile, tableName: string, schemaName: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService): Promise<void> {
	return new Promise<void>((resolve) => {
		queryEditorService.newEditDataEditor(schemaName, tableName).then((owner: EditDataInput) => {
			// Connect our editor
			let options: IConnectionCompletionOptions = {
				params: { connectionType: ConnectionType.editor, runQueryOnCompletion: RunQueryOnConnectionMode.none, input: owner },
				saveTheConnection: false,
				showDashboard: false,
				showConnectionDialogOnError: true
			};
			connectionService.connect(connectionProfile, owner.uri, options).then(() => {
				resolve();
			});
		});
	});
}

/**
 * Script the object as a statement based on the provided action
 */
export function script(connectionProfile: IConnectionProfile, metadata: data.ObjectMetadata, ownerUri: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService, scriptingService: IScriptingService, action: ScriptAction): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		connectIfNotAlreadyConnected(connectionProfile, connectionService).then(connectionResult => {
			scriptingService.script(ownerUri, metadata, action).then(result => {
				if (result && result.script) {
					let script = result.script;
					var startPos: number = getStartPos(script, action);
					if (startPos > 0) {
						script = script.substring(startPos);
					}
					queryEditorService.newSqlEditor(script).then(() => {
						resolve();
					}).catch(editorError => {
						reject(editorError);
					});
				} else {
					let errMsg = nls.localize("scriptNotFound", "No script was returned when calling script {action} on object {metadata.metadataTypeName}");
					reject(errMsg);
				}
			}, scriptingError => {
				reject(scriptingError);
			});
		}).catch(connectionError => {
			reject(connectionError);
		});
	});
}

export function newQuery(connectionProfile: IConnectionProfile, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService): Promise<void> {
	return new Promise<void>((resolve) => {
		queryEditorService.newSqlEditor().then((owner: IConnectableInput) => {
			// Connect our editor to the input connection
			let options: IConnectionCompletionOptions = {
				params: { connectionType: ConnectionType.editor, runQueryOnCompletion: RunQueryOnConnectionMode.none, input: owner },
				saveTheConnection: false,
				showDashboard: false,
				showConnectionDialogOnError: true
			};
			connectionService.connect(connectionProfile, owner.uri, options).then(() => {
				resolve();
			});
		});
	});
}

export function showCreateDatabase(
	connection: IConnectionProfile,
	adminService: IAdminService,
	errorMessageService: IErrorMessageService): Promise<void> {

	return new Promise<void>((resolve) => {
		// show not implemented
		errorMessageService.showDialog(Severity.Info,
			'Coming Soon',
			'This feature is not yet implemented.  It will be available in an upcoming release.');

		// adminService.showCreateDatabaseWizard(uri, connection);
	});
}

export function showCreateLogin(uri: string, connection: IConnectionProfile, adminService: IAdminService): Promise<void> {
	return new Promise<void>((resolve) => {
		adminService.showCreateLoginWizard(uri, connection);
	});
}

export function showBackup(connection: IConnectionProfile, disasterRecoveryUiService: IDisasterRecoveryUiService): Promise<void> {
	return new Promise<void>((resolve) => {
		disasterRecoveryUiService.showBackup(connection);
	});
}

export function showRestore(connection: IConnectionProfile, restoreDialogService: IRestoreDialogController): Promise<void> {
	return new Promise<void>((resolve) => {
		restoreDialogService.showDialog(connection);
	});
}

export function openInsight(query: IInsightsConfig, profile: IConnectionProfile, insightDialogService: IInsightsDialogService) {
	insightDialogService.show(query, profile);
}

/* Helper Methods */
function getStartPos(script: string, action: ScriptAction): number {
	switch(action)
	{
		case (ScriptAction.ScriptCreateAction):
			return script.toLowerCase().indexOf('create');
		case (ScriptAction.ScriptDeleteAction):
			return script.toLowerCase().indexOf('drop');
		default:
			/* start script from the start */
			return 0;
	}
}