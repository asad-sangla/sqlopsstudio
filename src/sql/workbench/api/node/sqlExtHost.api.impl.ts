/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as extHostApi from 'vs/workbench/api/node/extHost.api.impl';
import { TrieMap } from 'vs/base/common/map';
import { TPromise } from 'vs/base/common/winjs.base';
import { IInitData } from 'vs/workbench/api/node/extHost.protocol';
import { IThreadService } from 'vs/workbench/services/thread/common/threadService';
import { ExtHostExtensionService } from "vs/workbench/api/node/extHostExtensionService";
import { IWorkspaceContextService } from "vs/platform/workspace/common/workspace";
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions';
import { realpath } from 'fs';
import * as extHostTypes from 'vs/workbench/api/node/extHostTypes';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';

import * as data from 'data';
import * as vscode from 'vscode';
import { SqlExtHostContext, SqlInstanceCollection } from 'sql/workbench/api/node/sqlExtHost.protocol';
import { ExtHostCredentialManagement } from 'sql/workbench/api/node/extHostCredentialManagement';
import { ExtHostDataProtocol } from 'sql/workbench/api/node/extHostDataProtocol';
import * as sqlExtHostTypes from 'sql/workbench/api/node/sqlExtHostTypes';

export interface ISqlExtensionApiFactory {
	vsCodeFactory(extension: IExtensionDescription): typeof vscode;
	dataFactory(extension: IExtensionDescription): typeof data;
}

/**
 * This method instantiates and returns the extension API surface. This overrides the default ApiFactory by extending it to add Carbon-related functions
 */
export function createApiFactory(
		initData: IInitData, threadService: IThreadService, extensionService: ExtHostExtensionService,
		contextService: IWorkspaceContextService, telemetryService: ITelemetryService): ISqlExtensionApiFactory {
	let vsCodeFactory = extHostApi.createApiFactory(initData, threadService, extensionService, contextService, telemetryService);

	// Addressable instances
	const col = new SqlInstanceCollection();
	const extHostCredentialManagement = col.define(SqlExtHostContext.ExtHostCredentialManagement).set<ExtHostCredentialManagement>(new ExtHostCredentialManagement(threadService));
	const extHostDataProvider = col.define(SqlExtHostContext.ExtHostDataProtocol).set<ExtHostDataProtocol>(new ExtHostDataProtocol(threadService));
	col.finish(false, threadService);

	return {
		vsCodeFactory: vsCodeFactory,
		dataFactory: function (extension: IExtensionDescription): typeof data {
			// namespace: credentials
			const credentials: typeof data.credentials = {
				registerProvider(provider: data.CredentialProvider): vscode.Disposable  {
					return extHostCredentialManagement.$registerCredentialProvider(provider);
				},
			};

			// namespace: dataprotocol
			const dataprotocol: typeof data.dataprotocol = {
				registerProvider(provider: data.DataProtocolProvider): vscode.Disposable {
					// Connection callbacks
					provider.connectionProvider.registerOnConnectionComplete((connSummary: data.ConnectionInfoSummary) => {
						extHostDataProvider.$onConnectComplete(provider.handle, connSummary);
					});

					provider.connectionProvider.registerOnIntelliSenseCacheComplete((connectionUri: string) => {
						extHostDataProvider.$onIntelliSenseCacheComplete(provider.handle, connectionUri);
					});

					provider.connectionProvider.registerOnConnectionChanged((changedConnInfo: data.ChangedConnectionInfo) => {
						extHostDataProvider.$onConnectionChanged(provider.handle, changedConnInfo);
					});

					// Query callbacks
					provider.queryProvider.registerOnQueryComplete((result: data.QueryExecuteCompleteNotificationResult ) => {
						extHostDataProvider.$onQueryComplete(provider.handle, result);
					});

					provider.queryProvider.registerOnBatchStart((batchInfo: data.QueryExecuteBatchNotificationParams ) => {
						extHostDataProvider.$onBatchStart(provider.handle, batchInfo);
					});

					provider.queryProvider.registerOnBatchComplete((batchInfo: data.QueryExecuteBatchNotificationParams ) => {
						extHostDataProvider.$onBatchComplete(provider.handle, batchInfo);
					});

					provider.queryProvider.registerOnResultSetComplete((resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams ) => {
						extHostDataProvider.$onResultSetComplete(provider.handle, resultSetInfo);
					});

					provider.queryProvider.registerOnMessage((message: data.QueryExecuteMessageParams ) => {
						extHostDataProvider.$onQueryMessage(provider.handle, message);
					});

					// Edit Data callbacks
					provider.queryProvider.registerOnEditSessionReady((ownerUri: string, success: boolean, message: string) => {
						extHostDataProvider.$onEditSessionReady(provider.handle, ownerUri, success, message);
					});

					// Complete registration
					return extHostDataProvider.$registerProvider(provider);
				}
			};

			return {
				credentials,
				dataprotocol,
				ServiceOptionType: sqlExtHostTypes.ServiceOptionType,
				ConnectionOptionSpecialType: sqlExtHostTypes.ConnectionOptionSpecialType,
				EditRowState: sqlExtHostTypes.EditRowState,
				MetadataType: sqlExtHostTypes.MetadataType
			};
		}
	};
}

export function initializeExtensionApi(extensionService: ExtHostExtensionService, apiFactory: ISqlExtensionApiFactory): TPromise<void> {
	return createExtensionPathIndex(extensionService).then(trie => defineAPI(apiFactory, trie));
}

function createExtensionPathIndex(extensionService: ExtHostExtensionService): TPromise<TrieMap<IExtensionDescription>> {

	// create trie to enable fast 'filename -> extension id' look up
	const trie = new TrieMap<IExtensionDescription>(TrieMap.PathSplitter);
	const extensions = extensionService.getAllExtensionDescriptions().map(ext => {
		if (!ext.main) {
			return undefined;
		}
		return new TPromise((resolve, reject) => {
			realpath(ext.extensionFolderPath, (err, path) => {
				if (err) {
					reject(err);
				} else {
					trie.insert(path, ext);
					resolve(void 0);
				}
			});
		});
	});

	return TPromise.join(extensions).then(() => trie);
}

function defineAPI(factory: ISqlExtensionApiFactory, extensionPaths: TrieMap<IExtensionDescription>): void {
	type ApiImpl = typeof vscode | typeof data;

	// each extension is meant to get its own api implementation
	const extApiImpl = new Map<string, typeof vscode>();
	const dataExtApiImpl = new Map<string, typeof data>();
	let defaultApiImpl: typeof vscode;
	let defaultDataApiImpl: typeof data;

	// The module factory looks for an entry in the API map for an extension. If found, it reuses this.
	// If not, it loads it & saves it in the map
	let getModuleFactory = function(apiMap: Map<string, any>,
			createApi: (extensionDescription: IExtensionDescription) => ApiImpl,
			defaultImpl: ApiImpl,
			setDefaultApiImpl: (defaultImpl: ApiImpl) => void,
			parent: any): ApiImpl {
		// get extension id from filename and api for extension
		const ext = extensionPaths.findSubstr(parent.filename);
		if (ext) {
			let apiImpl = apiMap.get(ext.id);
			if (!apiImpl) {
				apiImpl = createApi(ext);
				apiMap.set(ext.id, apiImpl);
			}
			return apiImpl;
		}

		// fall back to a default implementation
		if (!defaultImpl) {
			defaultImpl = createApi(nullExtensionDescription);
			setDefaultApiImpl(defaultImpl);
		}
		return defaultImpl;
	};

	const node_module = <any>require.__$__nodeRequire('module');
	const original = node_module._load;

	// TODO look into de-duplicating this code
	node_module._load = function load(request, parent, isMain) {
		if (request === 'vscode') {
			return getModuleFactory(extApiImpl, (ext) => factory.vsCodeFactory(ext),
				defaultApiImpl,
				(impl) => defaultApiImpl = <typeof vscode> impl,
				parent);
		} else if (request === 'data') {
			return getModuleFactory(dataExtApiImpl,
				(ext) => factory.dataFactory(ext),
				defaultDataApiImpl,
				(impl) => defaultDataApiImpl = <typeof data> impl,
				parent);
		} else {
			// Allow standard node_module load to occur
			return original.apply(this, arguments);
		}
	};
}


const nullExtensionDescription: IExtensionDescription = {
	id: 'nullExtensionDescription',
	name: 'Null Extension Description',
	publisher: 'vscode',
	activationEvents: undefined,
	contributes: undefined,
	enableProposedApi: false,
	engines: undefined,
	extensionDependencies: undefined,
	extensionFolderPath: undefined,
	isBuiltin: false,
	main: undefined,
	version: undefined
};
