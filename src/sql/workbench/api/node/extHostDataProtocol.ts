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

export class ExtHostDataProtocol extends ExtHostDataProtocolShape  {

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
		this._adapter.set(provider.handle,provider);

		this._proxy.$registerProvider(provider.handle);
		return this._createDisposable(provider.handle);
	}

	// Capabilities Discovery handlers
	$getServerCapabilities(handle:number, client: data.DataProtocolClientCapabilities): Thenable<data.DataProtocolServerCapabilities> {
		return this._runWithProvider(handle, provider => {
			return provider.capabilitiesProvider ? provider.capabilitiesProvider.getServerCapabilities(client)
												 : undefined;
		});
	}

	// Connection Management handlers
	$connect(handle:number, connectionUri: string, connection: data.ConnectionInfo): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.connect(connectionUri, connection)
											   : undefined;
		});
	}

	$disconnect(handle:number, connectionUri: string): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.disconnect(connectionUri)
											   : undefined;
		});
	}

	$cancelConnect(handle:number, connectionUri: string): Thenable<boolean> {
		return this._runWithProvider(handle, provider => {
			return provider.connectionProvider ? provider.connectionProvider.cancelConnect(connectionUri)
											   : undefined;
		});
	}

	$onConnectComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {
		this._proxy.$onConnectionComplete(handle, connectionInfoSummary);
	}

	public $onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._proxy.$onIntelliSenseCacheComplete(handle, connectionUri);
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

	// Edit Data handlers
	$commitEdit(handle: number, ownerUri: string): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.commitEdit(ownerUri);
		});
	}

	$createRow(handle: number, ownerUri: string): Thenable<carbon.EditCreateRowResult> {
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

	$initializeEdit(handle: number, ownerUri: string, objectName: string, objectType: string): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.initializeEdit(ownerUri, objectName, objectType);
		});
	}

	$revertCell(handle: number, ownerUri: string, rowId: number, columnId: number): Thenable<carbon.EditRevertCellResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.revertCell(ownerUri, rowId, columnId);
		});
	}

	$revertRow(handle: number, ownerUri: string, rowId: number): Thenable<void> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.revertRow(ownerUri, rowId);
		});
	}

	$updateCell(handle: number, ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<carbon.EditUpdateCellResult> {
		return this._runWithProvider(handle, provider => {
			return provider.queryProvider.updateCell(ownerUri, rowId, columnId, newValue);
		});
	}

	$onEditSessionReady(handle: number, ownerUri: string, success: boolean): void {
		this._proxy.$onEditSessionReady(handle, ownerUri, success);
	}

	// Metadata handlers
	public $getMetadata(handle: number, connectionUri: string): Thenable<data.ProviderMetadata> {
		return this._runWithProvider(handle, provider => {
			return provider.metadataProvider ? provider.metadataProvider.getMetadata(connectionUri)
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
}
