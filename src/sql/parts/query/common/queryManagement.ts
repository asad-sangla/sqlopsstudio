/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IDisposable } from 'vs/base/common/lifecycle';
import data = require('data');
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { TPromise } from 'vs/base/common/winjs.base';

export const SERVICE_ID = 'queryManagementService';

export const IQueryManagementService = createDecorator<IQueryManagementService>(SERVICE_ID);

export interface IQueryManagementService {
	_serviceBrand: any;

	addQueryRequestHandler(queryType: string, runner: QueryRequestHandler): IDisposable;
	registerRunner(runner: QueryRunner, uri: string): void;

	cancelQuery(ownerUri: string): Thenable<data.QueryCancelResult>;
	runQuery(ownerUri: string, selection: data.ISelectionData): Thenable<void>;
	getQueryRows(rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult>;
	disposeQuery(ownerUri: string): Thenable<void>;


	onQueryComplete(result: data.QueryExecuteCompleteNotificationResult): void;
	onBatchStart(batchInfo: data.QueryExecuteBatchNotificationParams): void;
	onBatchComplete(batchInfo: data.QueryExecuteBatchNotificationParams): void;
	onResultSetComplete( resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void;
	onMessage(message: data.QueryExecuteMessageParams): void;
	onEditSessionReady(ownerUri: string, success: boolean): void;
}

/*
 * An object that can handle basic request-response actions related to queries
 */
export interface QueryRequestHandler {
	cancelQuery(ownerUri: string): Thenable<data.QueryCancelResult>;
	runQuery(ownerUri: string, selection: data.ISelectionData): Thenable<void>;
	getQueryRows(rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult>;
	disposeQuery(ownerUri: string): Thenable<void>;
}

export class QueryManagementService implements IQueryManagementService {
	public static readonly DefaultQueryType = 'MSSQL';
	public _serviceBrand: any;

	private _requestHandlers = new Map<string, QueryRequestHandler>();
    // public for testing only
    public _queryRunners = new Map<string, QueryRunner>();

    // public for testing only
    public _handlerCallbackQueue: ((run: QueryRunner) => void)[] = [];


    // Registers queryRunners with their uris to distribute notifications.
    // Ensures that notifications are handled in the correct order by handling
    // enqueued handlers first.
    // public for testing only
    public registerRunner(runner: QueryRunner, uri: string): void {
        // If enqueueOrRun was called before registerRunner for the current query,
        // _handlerCallbackQueue will be non-empty. Run all handlers in the queue first
        // so that notifications are handled in order they arrived
        while (this._handlerCallbackQueue.length > 0) {
            let handler = this._handlerCallbackQueue.shift();
            handler(runner);
        }

        // Set the runner for any other handlers if the runner is in use by the
        // current query or a subsequent query
        if (!runner.hasCompleted) {
            this._queryRunners.set(uri, runner);
        }
    }

    // Handles logic to run the given handlerCallback at the appropriate time. If the given runner is
    // undefined, the handlerCallback is put on the _handlerCallbackQueue to be run once the runner is set
    // public for testing only
    private enqueueOrRun(handlerCallback: (runnerParam: QueryRunner) => void, runner: QueryRunner): void {
        if (runner === undefined) {
            this._handlerCallbackQueue.push(handlerCallback);
        } else {
            handlerCallback(runner);
        }
    }

	private _notify(ownerUri: string, sendNotification: (runner: QueryRunner) => void): void {
		let runner = this._queryRunners.get(ownerUri);
		this.enqueueOrRun(sendNotification,runner);
	}

	public addQueryRequestHandler(queryType: string, handler: QueryRequestHandler): IDisposable {
		this._requestHandlers.set(queryType, handler);

		return {
			dispose: () => {
			}
		};
	}

	private _runAction<T>(queryType: string, action: (handler: QueryRequestHandler) => Thenable<T>): Thenable<T> {
		let handler = this._requestHandlers.get(queryType);
		if (handler) {
			return action(handler);
		} else {
			return TPromise.wrapError('No Handler Registered');
		}
	}

	public cancelQuery(ownerUri: string): Thenable<data.QueryCancelResult> {
		return this._runAction(QueryManagementService.DefaultQueryType, (runner) => {
			return runner.cancelQuery(ownerUri);
		});
	}
	public runQuery(ownerUri: string, selection: data.ISelectionData): Thenable<void> {
		return this._runAction(QueryManagementService.DefaultQueryType, (runner) => {
			return runner.runQuery(ownerUri, selection);
		});
	}
	public getQueryRows(rowData: data.QueryExecuteSubsetParams): Thenable<data.QueryExecuteSubsetResult> {
		return this._runAction(QueryManagementService.DefaultQueryType, (runner) => {
			return runner.getQueryRows(rowData);
		});
	}
	public disposeQuery(ownerUri: string): Thenable<void> {
		return this._runAction(QueryManagementService.DefaultQueryType, (runner) => {
			return runner.disposeQuery(ownerUri);
		});
	}

	public onQueryComplete(result: data.QueryExecuteCompleteNotificationResult): void {
		this._notify(result.ownerUri, (runner: QueryRunner) => {
			runner.handleQueryComplete(result);
		});
	}
	public onBatchStart(batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._notify(batchInfo.ownerUri, (runner: QueryRunner) => {
			runner.handleBatchStart(batchInfo);
		});
	}

	public onBatchComplete(batchInfo: data.QueryExecuteBatchNotificationParams): void {
		this._notify(batchInfo.ownerUri, (runner: QueryRunner) => {
			runner.handleBatchComplete(batchInfo);
		});
	}

	public onResultSetComplete( resultSetInfo: data.QueryExecuteResultSetCompleteNotificationParams): void {
		this._notify(resultSetInfo.ownerUri, (runner: QueryRunner) => {
			runner.handleResultSetComplete(resultSetInfo);
		});
	}

	public onMessage(message: data.QueryExecuteMessageParams): void {
		this._notify(message.ownerUri, (runner: QueryRunner) => {
			runner.handleMessage(message);
		});
	}
	public onEditSessionReady(ownerUri: string, success: boolean): void {

	}
}