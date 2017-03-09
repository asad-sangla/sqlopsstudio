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
	$connect(handle:number, connectionUri: string, connection: data.ConnectionInfo): Thenable<boolean> { throw ni(); }

	/**
	 * Callback when a connection request has completed
	 */
	$onConnectComplete(handle:number, connectionInfoSummary: data.ConnectionInfoSummary): void { throw ni(); }

	/**
	 * Callback when a IntelliSense cache has been built
	 */
	$onIntelliSenseCacheComplete(handle: number, connectionUri: string): void { throw ni(); }

	$getServerCapabilities(handle:number, client: data.DataProtocolClientCapabilities): Thenable<data.DataProtocolServerCapabilities> { throw ni(); }

	$getMetadata(handle: number, connectionUri: string): Thenable<data.ProviderMetadata> { throw ni(); }

	$scriptAsSelect(handle: number, connectionUri: string, objectName: string): Thenable<data.ScriptingResult> { throw ni(); }

	/**
	 * Cancels the currently running query for a URI
	 */
	$cancelQuery(handle: number, ownerUri: string): Thenable<data.QueryCancelResult> { throw ni(); }

	/**
	 * Runs a query for a text selection inside a document
	 */
	$runQuery(handle: number, ownerUri: string, selection: data.ISelectionData): Thenable<void> { throw ni(); }
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
	 * Commits all pending edits in an edit session
	 */
	$commitEdit(handle: number, ownerUri: string): Thenable<void> { throw ni(); }

	/**
	 * Creates a new row in the edit session
	 */
	$createRow(handle: number, ownerUri: string): Thenable<carbon.EditCreateRowResult> { throw ni(); }

	/**
	 * Marks the selected row for deletion in the edit session
	 */
	$deleteRow(handle: number, ownerUri: string, rowId: number): Thenable<void> { throw ni(); }

	/**
	 * Initializes a new edit data session for the requested table/view
	 */
	$initializeEdit(handle: number, ownerUri: string, objectName: string, objectType: string): Thenable<void> { throw ni(); }

	/**
	 * Reverts any pending changes for the requested cell and returns the original value
	 */
	$revertCell(handle: number, ownerUri: string, rowId: number, columnId: number): Thenable<carbon.EditRevertCellResult> { throw ni(); }

	/**
	 * Reverts any pending changes for the requested row
	 */
	$revertRow(handle: number, ownerUri: string, rowId: number): Thenable<void> { throw ni(); }

	/**
	 * Updates a cell value in the requested row. Returns if there are any corrections to the value
	 */
	$updateCell(handle: number, ownerUri: string, rowId: number, columId: number, newValue: string): Thenable<carbon.EditUpdateCellResult> { throw ni(); }

	/**
	 * Callback when a session has completed initialization
	 */
	$onEditSessionReady(handle: number, ownerUri: string, success: boolean) { throw ni(); }
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
	$registerProvider(handle: number): TPromise<any> { throw ni(); }
	$unregisterProvider(handle: number): TPromise<any> { throw ni(); }
	$onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void { throw ni(); }
	$onIntelliSenseCacheComplete(handle: number, connectionUri: string): void { throw ni(); }
	$onQueryComplete(handle: number, result: data.QueryExecuteCompleteNotificationResult): void { throw ni(); }
	$onBatchStart(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	$onBatchComplete(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void { throw ni(); }
	$onResultSetComplete(handle: number, resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void { throw ni(); }
	$onQueryMessage(handle: number, message: data.QueryExecuteMessageParams): void { throw ni(); }
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
