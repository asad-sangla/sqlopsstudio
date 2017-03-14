/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { SqlExtHostContext, ExtHostDataProtocolShape, MainThreadDataProtocolShape } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';
import { IQueryManagementService } from 'sql/parts/query/common/queryManagement';
import * as data from 'data';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';

/**
 * Main thread class for handling data protocol management registration.
 */
export class MainThreadDataProtocol extends MainThreadDataProtocolShape {

	private _proxy: ExtHostDataProtocolShape;

	private _toDispose: IDisposable[];

	private _capabilitiesRegistrations: { [handle: number]: IDisposable; } = Object.create(null);

	constructor(
		@IThreadService threadService: IThreadService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IQueryManagementService private _queryManagementService: IQueryManagementService,
		@IMetadataService private _metadataService: IMetadataService,
		@IScriptingService private _scriptingService: IScriptingService
	) {
		super();
		this._proxy = threadService.get(SqlExtHostContext.ExtHostDataProtocol);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	public $registerProvider(handle: number): TPromise<any> {
		let self = this;

		let providerId: string = handle.toString();

		// register connection management provider
		this._connectionManagementService.registerProvider(providerId, <data.ConnectionProvider> {
			connect(connectionUri: string, connectionInfo: data.ConnectionInfo): Thenable<boolean> {
				return self._proxy.$connect(handle, connectionUri, connectionInfo);
			},
			disconnect(connectionUri: string): Thenable<boolean> {
				return self._proxy.$disconnect(handle, connectionUri);
			},
			cancelConnect(connectionUri: string): Thenable<boolean> {
				return self._proxy.$cancelConnect(handle, connectionUri);
			}
		});

		this._capabilitiesService.registerProvider(<data.CapabilitiesProvider>{
			getServerCapabilities(client: data.DataProtocolClientCapabilities): Thenable<data.DataProtocolServerCapabilities> {
				return self._proxy.$getServerCapabilities(handle, client);
			}
		});

		// register query provider
		// TODO replace hard-coded queryType with plumbthrough
		this._queryManagementService.addQueryRequestHandler('MSSQL', {
			cancelQuery(ownerUri: string): Thenable<data.QueryCancelResult> {
				return self._proxy.$cancelQuery(handle, ownerUri);
			},
			runQuery(ownerUri: string, selection: data.ISelectionData): Thenable<void> {
				return self._proxy.$runQuery(handle, ownerUri, selection);
			},
    		getQueryRows(rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult> {
				return self._proxy.$getQueryRows(handle, rowData);
			},
			disposeQuery(ownerUri: string): Thenable<void> {
				return self._proxy.$disposeQuery(handle, ownerUri);
			}
		});

		this._metadataService.registerProvider(providerId, <data.MetadataProvider> {
			getMetadata(connectionUri: string): Thenable<data.ProviderMetadata> {
				return self._proxy.$getMetadata(handle, connectionUri);
			}
		});

		this._scriptingService.registerProvider(providerId, <data.ScriptingProvider> {
			scriptAsSelect(connectionUri: string, objectName: string): Thenable<data.ScriptingResult> {
				return self._proxy.$scriptAsSelect(handle, connectionUri, objectName);
			}
		});

		return undefined;
	}

	// Connection Management handlers
	public $onConnectionComplete(handle: number, connectionInfoSummary: data.ConnectionInfoSummary): void {
		this._connectionManagementService.onConnectionComplete(handle, connectionInfoSummary);
	}

	public $onIntelliSenseCacheComplete(handle: number, connectionUri: string): void {
		this._connectionManagementService.onIntelliSenseCacheComplete(handle, connectionUri);
	}

	// Query Management handlers
	public $onQueryComplete(handle: number, result: data.QueryExecuteCompleteNotificationResult): void {
		this._queryManagementService.onQueryComplete(result);
	}
	public $onBatchStart(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._queryManagementService.onBatchStart(batchInfo);
	}
	public $onBatchComplete(handle: number, batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._queryManagementService.onBatchComplete(batchInfo);
	}

	public $onResultSetComplete(handle: number, resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void {
		this._queryManagementService.onResultSetComplete(resultSetInfo);
	}
	public $onQueryMessage(handle: number, message: data.QueryExecuteMessageParams): void {
		this._queryManagementService.onMessage(message);
	}

	public $unregisterProvider(handle: number): TPromise<any> {
		let capabilitiesRegistration = this._capabilitiesRegistrations[handle];
		if (capabilitiesRegistration) {
			capabilitiesRegistration.dispose();
			delete this._capabilitiesRegistrations[handle];
		}

		return undefined;
	}
}
