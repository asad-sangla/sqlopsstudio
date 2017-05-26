/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import {
	IConnectableInput, IConnectionManagementService,
	IConnectionCompletionOptions, ConnectionType
} from 'sql/parts/connection/common/connectionManagement';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IScriptingService } from 'sql/services/scripting/scriptingService';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { IAdminService } from 'sql/parts/admin/common/adminService';
import { IDisasterRecoveryService } from 'sql/parts/disasterRecovery/common/disasterRecoveryService';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

import data = require('data');

export class TaskUtilities {

	private static connectIfNotAlreadyConnected(connectionProfile: ConnectionProfile, connectionService: IConnectionManagementService): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			let uri = connectionService.getConnectionId(connectionProfile);
			if (!connectionService.isConnected(uri)) {
				let options: IConnectionCompletionOptions = {
					params: { connectionType: ConnectionType.editor, runQueryOnCompletion: true, input: undefined },
					saveTheConnection: false,
					showDashboard: false,
					showConnectionDialogOnError: false
				};
				connectionService.connect(connectionProfile, uri, options).then(() => {
				setTimeout(function(){
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
	public static scriptSelect(connectionProfile: ConnectionProfile, metadata: data.ObjectMetadata, ownerUri: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService, scriptingService: IScriptingService): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			TaskUtilities.connectIfNotAlreadyConnected(connectionProfile, connectionService).then(connectionResult => {
				scriptingService.scriptAsSelect(ownerUri, metadata).then(result => {
					if (result && result.script) {
						queryEditorService.newSqlEditor(result.script).then((owner: IConnectableInput) => {
							// Connect our editor to the input connection
							let options: IConnectionCompletionOptions = {
								params: { connectionType: ConnectionType.editor, runQueryOnCompletion: true, input: owner },
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
	public static editData(connectionProfile: IConnectionProfile, tableName: string, schemaName: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService): Promise<void> {
		return new Promise<void>((resolve) => {
			queryEditorService.newEditDataEditor(schemaName, tableName).then((owner: EditDataInput) => {
				// Connect our editor
				let options: IConnectionCompletionOptions = {
					params: { connectionType: ConnectionType.editor, runQueryOnCompletion: false, input: owner },
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
	public static scriptCreate(connectionProfile: ConnectionProfile, metadata: data.ObjectMetadata, ownerUri: string, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService, scriptingService: IScriptingService): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			TaskUtilities.connectIfNotAlreadyConnected(connectionProfile, connectionService).then(connectionResult => {
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

	public static newQuery(connectionProfile: IConnectionProfile, connectionService: IConnectionManagementService, queryEditorService: IQueryEditorService): Promise<void> {
		return new Promise<void>((resolve) => {
			queryEditorService.newSqlEditor().then((owner: IConnectableInput) => {
				// Connect our editor to the input connection
				let options: IConnectionCompletionOptions = {
					params: { connectionType: ConnectionType.editor, runQueryOnCompletion: false, input: owner },
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

	public static showCreateDatabase(uri: string, connection: ConnectionManagementInfo, adminService: IAdminService): Promise<void> {
		return new Promise<void>((resolve) => {
			adminService.showCreateDatabaseWizard(uri, connection);
		});
	}

	public static showCreateLogin(uri: string, connection: ConnectionManagementInfo, adminService: IAdminService): Promise<void> {
		return new Promise<void>((resolve) => {
			adminService.showCreateLoginWizard(uri, connection);
		});
	}

	public static showBackup(uri: string, connection: ConnectionManagementInfo, disasterRecoveryService: IDisasterRecoveryService): Promise<void> {
		return new Promise<void>((resolve) => {
			disasterRecoveryService.showBackupWizard(uri, connection);
		});
	}
}