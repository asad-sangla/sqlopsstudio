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
import { IDisasterRecoveryUiService, IRestoreDialogService } from 'sql/parts/disasterRecovery/common/interfaces';
import { InsightsConfig } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { withElementById } from 'vs/base/browser/builder';
import { IInsightsDialogService } from 'sql/parts/insights/insightsDialogService';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Severity from 'vs/base/common/severity';

import data = require('data');

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
			scriptingService.scriptAsSelect(ownerUri, metadata).then(result => {
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
					reject('Scripting service did not return anything');
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
 * Script the object as a CREATE statement
 */
export function scriptCreate(connectionProfile: IConnectionProfile, metadata: data.ObjectMetadata, ownerUri: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService, scriptingService: IScriptingService): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		connectIfNotAlreadyConnected(connectionProfile, connectionService).then(connectionResult => {
			scriptingService.scriptAsCreate(ownerUri, metadata).then(result => {
				if (result && result.script) {
					let script = result.script;
					var startPos: number = script.toLowerCase().indexOf('create');
					if (startPos > 0) {
						script = script.substring(startPos);
					}
					queryEditorService.newSqlEditor(script).then(() => {
						resolve();
					}).catch(editorError => {
						reject(editorError);
					});
				} else {
					reject('Scripting service did not return anything');
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
	uri: string, connection: IConnectionProfile,
	adminService: IAdminService,
	errorMessageService: IErrorMessageService,
	partService: IPartService): Promise<void> {

	return new Promise<void>((resolve) => {
		// show not implemented
		let container = withElementById(partService.getWorkbenchElementId()).getHTMLElement().parentElement;
		errorMessageService.showDialog(container, Severity.Info,
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

export function showRestore(uri: string, connection: IConnectionProfile, restoreDialogService: IRestoreDialogService): Promise<void> {
	return new Promise<void>((resolve) => {
		restoreDialogService.showDialog(uri, connection);
	});
}

export async function openInsight(query: InsightsConfig, profile: IConnectionProfile, insightDialogService: IInsightsDialogService) {
	return insightDialogService.show(query, profile);
}