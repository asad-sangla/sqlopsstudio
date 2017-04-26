/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlMainContext, MainThreadDataProtocolShape, ExtHostDataProtocolShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import * as vscode from 'vscode';
import * as data from 'data';
import { Disposable } from 'vs/workbench/api/node/extHostTypes';

export class ExtHostDataProtocol extends ExtHostDataProtocolShape {

	private _proxy: MainThreadDataProtocolShape;

	private static _handlePool: number = 0;
	private _adapter = new Map<number, data.DataProtocolProvider>();

	constructor(
		threadService: IThreadService
	) {
		super();
		this._proxy = threadService.get(SqlMainContext.MainThreadDataProtocol);
	}

	private _createDisposable(handle: number): Disposable {
		return new Disposable(() => {
			this._adapter.delete(handle);
			this._proxy.$unregisterProvider(handle);
		});
	}

	private _nextHandle(): number {
		return ExtHostDataProtocol._handlePool++;
	}

	private _runWithProvider<T>(handle: number, action: (p: data.DataProtocolProvider) => Thenable<T>): Thenable<T> {
		let provider = this._adapter.get(handle);
		return provider !== undefined
			? action(provider)
			: undefined;
	}

	$registerProvider(provider: data.DataProtocolProvider): vscode.Disposable {
		provider.handle = this._nextHandle();
		this._adapter.set(provider.handle, provider);

		this._proxy.$registerProvider(provider.providerId, provider.handle);
		return this._createDisposable(provider.handle);
	}

	// Capabilities Discovery handlers
	$getServerCapabilities(handle: number, client: data.DataProtocolClientCapabilities): Thenable<data.DataProtocolServerCapabilities> {
		return this._runWithProvider(handle, provider => {
			return provider.capabilitiesProvider ? provider.capabilitiesProvider.getServerCapabilities(client)
				: undefined;
		});
	}

	// Connection Management handlers
	$connect(handle: number, connectionUri: string, connection: data.ConnectionInfo): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.connect(connectionUri, connection)
				: undefined;
		});
	}

	$disconnect(handle: number, connectionUri: string): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.disconnect(connectionUri)
				: undefined;
		});
	}

	$cancelConnect(handle: number, connectionUri: string): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.cancelConnect(connectionUri)
				: undefined;
		});
	}

	$listDatabases(handle: number, connectionUri: string): Thenable<data.ListDatabasesResult> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.listDatabases(connectionUri)
				: undefined;
		});
	}

	$onConnectComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {
		this._proxy.$onConnectionComplete(handle, connectionInfoSummary);
	}

	public $onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._proxy.$onIntelliSenseCacheComplete(handle, connectionUri);
	}

	public $onConnectionChanged(handle: number, changedConnInfo: data.ChangedConnectionInfo): void {
		this._proxy.$onConnectionChangeNotification(handle, changedConnInfo);
	}

	// Query Management handlers

	$cancelQuery(handle: number, ownerUri: string): Thenable<data.QueryCancelResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.cancelQuery(ownerUri);
		});
	}

	$runQuery(handle: number, ownerUri: string, selection: data.ISelectionData): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.runQuery(ownerUri, selection);
		});
	}

	$getQueryRows(handle: number, rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult> {
		return this._runWithProvider(handle, (provider) => {
			return provider.queryProvider.getQueryRows(rowData);
		});
	}

	$disposeQuery(handle: number, ownerUri: string): Thenable<void> {
		return this._runWithProvider(handle, (provider) => {
			return provider.queryProvider.disposeQuery(ownerUri);
		});
	}

	$onQueryComplete(handle: number, result: data.QueryExecuteCompleteNotificationResult): void {
		this._proxy.$onQueryComplete(handle, result);
	}
	$onBatchStart(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._proxy.$onBatchStart(handle, batchInfo);
	}
	$onBatchComplete(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._proxy.$onBatchComplete(handle, batchInfo);
	}
	$onResultSetComplete(handle: number, resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void {
		this._proxy.$onResultSetComplete(handle, resultSetInfo);
	}
	$onQueryMessage(handle: number, message: data.QueryExecuteMessageParams): void {
		this._proxy.$onQueryMessage(handle, message);
	}

	$saveResults(handle: number, requestParams: data.SaveResultsRequestParams): Thenable<data.SaveResultRequestResult> {
		return this._runWithProvider(handle, (provider) => {
			return provider.queryProvider.saveResults(requestParams);
		});
	}

	// Edit Data handlers
	$commitEdit(handle: number, ownerUri: string): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.commitEdit(ownerUri);
		});
	}

	$createRow(handle: number, ownerUri: string): Thenable<data.EditCreateRowResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.createRow(ownerUri);
		});
	}

	$deleteRow(handle: number, ownerUri: string, rowId: number): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.deleteRow(ownerUri, rowId);
		});
	}

	$disposeEdit(handle: number, ownerUri: string): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.disposeEdit(ownerUri);
		});
	}

	$initializeEdit(handle: number, ownerUri: string, objectName: string, objectType: string, rowLimit: number): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.initializeEdit(ownerUri, objectName, objectType, rowLimit);
		});
	}

	$revertCell(handle: number, ownerUri: string, rowId: number, columnId: number): Thenable<data.EditRevertCellResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.revertCell(ownerUri, rowId, columnId);
		});
	}

	$revertRow(handle: number, ownerUri: string, rowId: number): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.revertRow(ownerUri, rowId);
		});
	}

	$updateCell(handle: number, ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<data.EditUpdateCellResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.updateCell(ownerUri, rowId, columnId, newValue);
		});
	}

	$getEditRows(handle: number, rowData: data.EditSubsetParams): Thenable<data.EditSubsetResult> {
		return this._runWithProvider(handle, (provider) => {
			return provider.queryProvider.getEditRows(rowData);
		});
	}

	$onEditSessionReady(handle: number, ownerUri: string, success: boolean, message: string): void {
		this._proxy.$onEditSessionReady(handle, ownerUri, success, message);
	}

	// Metadata handlers
	public $getMetadata(handle: number, connectionUri: string): Thenable<data.ProviderMetadata> {
		return this._runWithProvider(handle, provider => {
			return provider.metadataProvider ? provider.metadataProvider.getMetadata(connectionUri)
				: Promise.resolve(undefined);
		});
	}

	// Object Explorer Service
	public $createObjectExplorerSession(handle: number, connInfo: data.ConnectionInfo): Thenable<data.ObjectExplorerSession> {
		return this._runWithProvider(handle, provider => {
			return provider.objectExplorerProvider ? provider.objectExplorerProvider.createNewSession(connInfo)
				: Promise.resolve(undefined);
		});
	}

	public $expandObjectExplorerNode(handle: number, nodeInfo: data.ExpandNodeInfo): Thenable<data.ObjectExplorerExpandInfo> {
		return this._runWithProvider(handle, provider => {
			return provider.objectExplorerProvider ? provider.objectExplorerProvider.expandNode(nodeInfo)
				: Promise.resolve(undefined);
		});
	}

	public $getDatabases(handle: number, connectionUri: string): Thenable<string[]> {
		return this._runWithProvider(handle, provider => {
			return provider.metadataProvider ? provider.metadataProvider.getDatabases(connectionUri)
				: Promise.resolve(undefined);
		});
	}

	public $getTableInfo(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ColumnMetadata[]> {
		return this._runWithProvider(handle, provider => {
			return provider.metadataProvider ? provider.metadataProvider.getTableInfo(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	public $getViewInfo(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ColumnMetadata[]> {
		return this._runWithProvider(handle, provider => {
			return provider.metadataProvider ? provider.metadataProvider.getViewInfo(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	// Scripting handlers
	public $scriptAsSelect(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> {
		return this._runWithProvider(handle, provider => {
			return provider.scriptingProvider ? provider.scriptingProvider.scriptAsSelect(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	public $scriptAsCreate(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> {
		return this._runWithProvider(handle, provider => {
			return provider.scriptingProvider ? provider.scriptingProvider.scriptAsCreate(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	public $scriptAsUpdate(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> {
		return this._runWithProvider(handle, provider => {
			return provider.scriptingProvider ? provider.scriptingProvider.scriptAsUpdate(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	public $scriptAsInsert(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> {
		return this._runWithProvider(handle, provider => {
			return provider.scriptingProvider ? provider.scriptingProvider.scriptAsInsert(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	public $scriptAsDelete(handle: number, connectionUri: string, metadata: data.ObjectMetadata): Thenable<data.ScriptingResult> {
		return this._runWithProvider(handle, provider => {
			return provider.scriptingProvider ? provider.scriptingProvider.scriptAsDelete(connectionUri, metadata)
				: Promise.resolve(undefined);
		});
	}

	/**
	 * Create a new database on the provided connection
	 */
	public $createDatabase(handle: number, connectionUri: string, database: data.DatabaseInfo): Thenable<data.CreateDatabaseResponse> {
		return this._runWithProvider(handle, provider => {
			return provider.adminServicesProvider ? provider.adminServicesProvider.createDatabase(connectionUri, database)
				: Promise.resolve(undefined);
		});
	}

	/**
	 * Backup a database
	 */
	public $backup(handle: number, connectionUri: string, backupInfo: data.BackupInfo): Thenable<data.BackupResponse> {
		return this._runWithProvider(handle, provider => {
			return provider.disasterRecoveryProvider ? provider.disasterRecoveryProvider.backup(connectionUri, backupInfo)
				: Promise.resolve(undefined);
		});
	 }
}
