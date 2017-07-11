/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import {
	createMainContextProxyIdentifier as createMainId,
	createExtHostContextProxyIdentifier as createExtId,
	ProxyIdentifier, IThreadService
} from 'vs/workbench/services/thread/common/threadService';

import * as data from 'data';

import { TPromise } from 'vs/base/common/winjs.base';
import { InstanceSetter } from 'vs/workbench/api/node/extHost.protocol';

export abstract class ExtHostDataProtocolShape {

	/**
	 * Establish a connection to a data source using the provided ConnectionInfo instance.
	 */
	$connect(handle: number, connectionUri: string, connection: data.ConnectionInfo): Thenable<boolean> { throw ni(); }

	/**
	 * Disconnect from a data source using the provided connectionUri string.
	 */
	$disconnect(handle: number, connectionUri: string): Thenable<boolean> { throw ni(); }

	/**
	 * Cancel a connection to a data source using the provided connectionUri string.
	 */
	$cancelConnect(handle: number, connectionUri: string): Thenable<boolean> { throw ni(); }

	/**
	 * List databases for a data source using the provided connectionUri string.
	 * @param handle the handle to use when looking up a provider
	 * @param connectionUri URI identifying a connected resource
	 */
	$listDatabases(handle: number, connectionUri: string): Thenable<data.ListDatabasesResult> { throw ni(); }

	/**
	 * Notifies all listeners on the Extension Host side that a language change occurred
	 * for a dataprotocol language. The sub-flavor is the specific implementation used for query
	 * and other events
	 * @param params information on what URI was changed and the new language
	 */
	$languageFlavorChanged(params: data.DidChangeLanguageFlavorParams): void { throw ni(); }

	/**
	 * Callback when a connection request has completed
	 */
	$onConnectComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void { throw ni(); }

	/**
	 * Callback when a IntelliSense cache has been built
	 */
	$onIntelliSenseCacheComplete(handle: number, connectionUri: string): void { throw ni(); }

	$getServerCapabilities(handle: number, client: data.DataProtocolClientCapabilities): Thenable<data.DataProtocolServerCapabilities> { throw ni(); }

	/**
	 * Metadata service methods
	 *
	 */
	$getMetadata(handle: number, connectionUri: string): Thenable<data.ProviderMetadata> { throw ni(); }

	$getDatabases(handle: number, connectionUri: string): Thenable<string[]> { throw ni(); }

	$getTableInfo(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ColumnMetadata[]> { throw ni(); }

	$getViewInfo(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ColumnMetadata[]> { throw ni(); }

	/**
	 * Object Explorer
	 */
	$createObjectExplorerSession(handle: number, connInfo: data.ConnectionInfo): Thenable<data.ObjectExplorerSessionResponse> { throw ni(); }

	$expandObjectExplorerNode(handle: number, nodeInfo: data.ExpandNodeInfo): Thenable<boolean> { throw ni(); }

	$refreshObjectExplorerNode(handle: number, nodeInfo: data.ExpandNodeInfo): Thenable<boolean> { throw ni(); }

	$closeObjectExplorerSession(handle: number, closeSessionInfo: data.ObjectExplorerCloseSessionInfo): Thenable<data.ObjectExplorerCloseSessionResponse> { throw ni(); }

	/**
	 * Tasks
	 */
	$getAllTasks(handle: number, listTasksParams: data.ListTasksParams): Thenable<data.ListTasksResponse> { throw ni(); }
	$cancelTask(handle: number, cancelTaskParams: data.CancelTaskParams): Thenable<boolean> { throw ni(); }

	/**
	 * Scripting methods
	 */
	$scriptAsSelect(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> { throw ni(); }
	$scriptAsCreate(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> { throw ni(); }
	$scriptAsUpdate(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> { throw ni(); }
	$scriptAsInsert(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> { throw ni(); }
	$scriptAsDelete(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> { throw ni(); }

	/**
	 * Cancels the currently running query for a URI
	 */
	$cancelQuery(handle: number, ownerUri: string): Thenable<data.QueryCancelResult> { throw ni(); }

	/**
	 * Runs a query for a text selection inside a document
	 */
	$runQuery(handle: number, ownerUri: string, selection: data.ISelectionData): Thenable<void> { throw ni(); }
	/**
	 * Runs a query for a provided query
	 */
	$runQueryString(handle: number, ownerUri: string, queryString: string): Thenable<void> { throw ni(); }
	/**
	 * Runs a query for a provided query and returns result
	 */
	$runQueryAndReturn(handle: number, ownerUri: string, queryString: string): Thenable<data.SimpleExecuteResult> { throw ni(); }
	/**
	 * Gets a subset of rows in a result set in order to display in the UI
	 */
	$getQueryRows(handle: number, rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult> { throw ni(); }

	/**
	 * Disposes the cached information regarding a query
	 */
	$disposeQuery(handle: number, ownerUri: string): Thenable<void> { throw ni(); }

	/**
	 * Callback when a query has completed
	 */
	$onQueryComplete(handle: number, result: data.QueryExecuteCompleteNotificationResult): void { throw ni(); }
	/**
	 * Callback when a batch has started. This enables the UI to display when batch execution has started
	 */
	$onBatchStart(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	/**
	 * Callback when a batch is complete. This includes updated information on result sets, time to execute, and
	 * other relevant batch information
	 */
	$onBatchComplete(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	/**
	 * Callback when a result set has been returned from query execution and can be displayed
	 */
	$onResultSetComplete(handle: number, resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void { throw ni(); }
	/**
	 * Callback when a message generated during query execution is issued
	 */
	$onQueryMessage(handle: number, message: data.QueryExecuteMessageParams): void { throw ni(); }

	/**
	 * Requests saving of the results from a result set into a specific format (CSV, JSON, Excel)
	 */
	$saveResults(handle: number, requestParams: data.SaveResultsRequestParams): Thenable<data.SaveResultRequestResult> { throw ni(); }

	/**
	 * Commits all pending edits in an edit session
	 */
	$commitEdit(handle: number, ownerUri: string): Thenable<void> { throw ni(); }

	/**
	 * Creates a new row in the edit session
	 */
	$createRow(handle: number, ownerUri: string): Thenable<data.EditCreateRowResult> { throw ni(); }

	/**
	 * Marks the selected row for deletion in the edit session
	 */
	$deleteRow(handle: number, ownerUri: string, rowId: number): Thenable<void> { throw ni(); }

	/**
	 * Initializes a new edit data session for the requested table/view
	 */
	$initializeEdit(handle: number, ownerUri: string, schemaName: string, objectName: string, objectType: string, rowLimit: number): Thenable<void> { throw ni(); }

	/**
	 * Reverts any pending changes for the requested cell and returns the original value
	 */
	$revertCell(handle: number, ownerUri: string, rowId: number, columnId: number): Thenable<data.EditRevertCellResult> { throw ni(); }

	/**
	 * Reverts any pending changes for the requested row
	 */
	$revertRow(handle: number, ownerUri: string, rowId: number): Thenable<void> { throw ni(); }

	/**
	 * Updates a cell value in the requested row. Returns if there are any corrections to the value
	 */
	$updateCell(handle: number, ownerUri: string, rowId: number, columId: number, newValue: string): Thenable<data.EditUpdateCellResult> { throw ni(); }

	/**
	 * Gets a subset of rows in a result set, merging pending edit changes in order to display in the UI
	 */
	$getEditRows(handle: number, rowData: data.EditSubsetParams): Thenable<data.EditSubsetResult> { throw ni(); }

	/**
	 * Diposes an initialized edit session and cleans up pending edits
	 */
	$disposeEdit(handle: number, ownerUri: string): Thenable<void> { throw ni(); }

	/**
	 * Create a new database on the provided connection
	 */
	$createDatabase(handle: number, connectionUri: string, database: data.DatabaseInfo): Thenable<data.CreateDatabaseResponse> { throw ni(); }

	/**
	 * Get the default database prototype
	 */
	$getDefaultDatabaseInfo(handle: number, connectionUri: string): Thenable<data.DatabaseInfo> { throw ni(); }

	/**
	 * Get the database info
	 */
	$getDatabaseInfo(handle: number, connectionUri: string): Thenable<data.DatabaseInfo> { throw ni(); }

	/**
	 * Create a new login on the provided connection
	 */
	$createLogin(handle: number, connectionUri: string, login: data.LoginInfo): Thenable<data.CreateLoginResponse> { throw ni(); }

	/**
	 * Backup a database
	 */
	$backup(handle: number, connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse> { throw ni(); }

	/**
	 * Get the extended database prototype
	 */
	$getBackupConfigInfo(handle: number, connectionUri: string): Thenable<data.BackupConfigInfo> { throw ni(); }

	/**
	 * Restores a database
	 */
	$restore(handle: number, connectionUri: string, restoreInfo: data.RestoreInfo): Thenable<data.RestoreResponse> { throw ni(); }

	/**
	 * Gets a plan for restoring a database
	 */
	$getRestorePlan(handle: number, connectionUri: string, restoreInfo: data.RestoreInfo): Thenable<data.RestorePlanResponse> { throw ni(); }
}

/**
 * Credential Management extension host class.
 */
export abstract class ExtHostCredentialManagementShape {
	$saveCredential(credentialId: string, password: string): Thenable<boolean> { throw ni(); }

	$readCredential(credentialId: string): Thenable<data.Credential> { throw ni(); }

	$deleteCredential(credentialId: string): Thenable<boolean> { throw ni(); }
}

export abstract class MainThreadDataProtocolShape {
	$registerProvider(providerId: string, handle: number): TPromise<any> { throw ni(); }
	$unregisterProvider(handle: number): TPromise<any> { throw ni(); }
	$onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void { throw ni(); }
	$onIntelliSenseCacheComplete(handle: number, connectionUri: string): void { throw ni(); }
	$onConnectionChangeNotification(handle: number, changedConnInfo: data.ChangedConnectionInfo): void { throw ni(); }
	$onQueryComplete(handle: number, result: data.QueryExecuteCompleteNotificationResult): void { throw ni(); }
	$onBatchStart(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	$onBatchComplete(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	$onResultSetComplete(handle: number, resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void { throw ni(); }
	$onQueryMessage(handle: number, message: data.QueryExecuteMessageParams): void { throw ni(); }
	$onObjectExplorerSessionCreated(handle: number, message: data.ObjectExplorerSession): void { throw ni(); }
	$onObjectExplorerNodeExpanded(handle: number, message: data.ObjectExplorerExpandInfo): void { throw ni(); }
	$onTaskCreated(handle: number, sessionResponse: data.TaskInfo): void { throw ni(); }
	$onTaskStatusChanged(handle: number, sessionResponse: data.TaskProgressInfo): void { throw ni(); }

	/**
	 * Callback when a session has completed initialization
	 */
	$onEditSessionReady(handle: number, ownerUri: string, success: boolean, message: string) { throw ni(); }
}

export abstract class MainThreadCredentialManagementShape {
	$registerCredentialProvider(handle: number): TPromise<any> { throw ni(); }
	$unregisterCredentialProvider(handle: number): TPromise<any> { throw ni(); }
}


export class SqlInstanceCollection {
	private _items: { [id: string]: any; };

	constructor() {
		this._items = Object.create(null);
	}

	public define<T>(id: ProxyIdentifier<T>): InstanceSetter<T> {
		let that = this;
		return new class {
			set(value: T) {
				that._set(id, value);
				return value;
			}
		};
	}

	_set<T>(id: ProxyIdentifier<T>, value: T): void {
		this._items[id.id] = value;
	}

	public finish(isMain: boolean, threadService: IThreadService): void {
		let expected = (isMain ? SqlMainContext : SqlExtHostContext);
		Object.keys(expected).forEach((key) => {
			let id = expected[key];
			let value = this._items[id.id];

			if (!value) {
				throw new Error(`Missing actor ${key} (isMain: ${id.isMain}, id:  ${id.id})`);
			}
			threadService.set<any>(id, value);
		});
	}
}

function ni() { return new Error('Not implemented'); }

// --- proxy identifiers

export const SqlMainContext = {
	// SQL entries
	MainThreadCredentialManagement: createMainId<MainThreadCredentialManagementShape>('MainThreadCredentialManagement', MainThreadCredentialManagementShape),
	MainThreadDataProtocol: createMainId<MainThreadDataProtocolShape>('MainThreadDataProtocol', MainThreadDataProtocolShape)
};

export const SqlExtHostContext = {
	ExtHostCredentialManagement: createExtId<ExtHostCredentialManagementShape>('ExtHostCredentialManagement', ExtHostCredentialManagementShape),
	ExtHostDataProtocol: createExtId<ExtHostDataProtocolShape>('ExtHostDataProtocol', ExtHostDataProtocolShape)
};
