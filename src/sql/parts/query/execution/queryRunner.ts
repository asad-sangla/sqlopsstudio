/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { BatchSummary, QueryCancelResult,
    QueryExecuteCompleteNotificationResult, QueryExecuteSubsetResult, QueryExecuteResultSetCompleteNotificationParams,
    QueryExecuteSubsetParams, QueryExecuteMessageParams, QueryExecuteBatchNotificationParams,
    ISelectionData } from 'data';

import { EventEmitter } from 'events';
import { IQueryManagementService } from 'sql/parts/query/common/queryManagement';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import * as Utils from 'sql/parts/connection/node/utils';

/*
* Query Runner class which handles running a query, reports the results to the content manager,
* and handles getting more rows from the service layer and disposing when the content is closed.
*/
export default class QueryRunner {
	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _batchSets: BatchSummary[] = [];
	private _isExecuting: boolean;
	private _uri: string;
	private _title: string;
	private _resultLineOffset: number;
	private _totalElapsedMilliseconds: number;
	private _hasCompleted: boolean;
	public eventEmitter: EventEmitter = new EventEmitter();

	// CONSTRUCTOR /////////////////////////////////////////////////////////

	constructor (private _ownerUri: string,
			private _editorTitle: string,
			@IQueryManagementService private _queryManagementService: IQueryManagementService,
			@IMessageService private _messageService: IMessageService) {

		// Store the state
		this._uri = _ownerUri;
		this._title = _editorTitle;
		this._isExecuting = false;
		this._totalElapsedMilliseconds = 0;
		this._hasCompleted = false;
	}

	// PROPERTIES //////////////////////////////////////////////////////////

	get uri(): string {
		return this._uri;
	}

	set uri(uri: string) {
		this._uri = uri;
	}

	get title(): string {
		return this._title;
	}

	set title(title: string) {
		this._title = title;
	}

	get batchSets(): BatchSummary[] {
		return this._batchSets;
	}

	set batchSets(batchSets: BatchSummary[]) {
		this._batchSets = batchSets;
	}

	get isExecutingQuery(): boolean {
		return this._isExecuting;
	}

	get hasCompleted(): boolean {
		return this._hasCompleted;
	}

	// PUBLIC METHODS ======================================================

	/**
	 * Cancels the running query, if there is one
	 */
	public cancelQuery(): Thenable<QueryCancelResult> {
		return this._queryManagementService.cancelQuery(this._uri);
	}

	/**
	 * Pulls the query text from the current document/selection and initiates the query
	 */
	public runQuery(selection: ISelectionData): Thenable<void> {
		const self = this;

		// Update internal state to show that we're executing the query
		this._resultLineOffset = selection ? selection.startLine : 0;
		this._isExecuting = true;
		this._totalElapsedMilliseconds = 0;
		// TODO issue #228 add statusview callbacks here

		// Send the request to execute the query
		let ownerUri = this._uri;
		return this._queryManagementService.runQuery(ownerUri, selection).then(result => {
			// The query has started, so lets fire up the result pane
			self.eventEmitter.emit('start');
			self._queryManagementService.registerRunner(self, ownerUri);
		}, error => {
			// Attempting to launch the query failed, show the error message

			// TODO issue #228 add statusview callbacks here
			self._isExecuting = false;

			// TODO localize
			self._messageService.show(Severity.Error, 'Execution failed: ' + error);
		});
	}

	/**
	 * Handle a QueryComplete from the service layer
	 */
	public handleQueryComplete(result: QueryExecuteCompleteNotificationResult): void {

		// Store the batch sets we got back as a source of "truth"
		this._isExecuting = false;
		this._hasCompleted = true;
		this._batchSets = result.batchSummaries;

		this._batchSets.map((batch) => {
			if (batch.selection) {
				batch.selection.startLine = batch.selection.startLine + this._resultLineOffset;
				batch.selection.endLine = batch.selection.endLine + this._resultLineOffset;
			}
		});

		// We're done with this query so shut down any waiting mechanisms
		this.eventEmitter.emit('complete', Utils.parseNumAsTimeString(this._totalElapsedMilliseconds));
	}

	/**
	 * Handle a BatchStart from the service layer
	 */
	public handleBatchStart(result: QueryExecuteBatchNotificationParams): void {
		let batch = result.batchSummary;

		// Recalculate the start and end lines, relative to the result line offset
		if (batch.selection) {
			batch.selection.startLine += this._resultLineOffset;
			batch.selection.endLine += this._resultLineOffset;
		}

		// Set the result sets as an empty array so that as result sets complete we can add to the list
		batch.resultSetSummaries = [];

		// Store the batch
		this._batchSets[batch.id] = batch;
		this.eventEmitter.emit('batchStart', batch);
	}

	/**
	 * Handle a BatchComplete from the service layer
	 */
	public handleBatchComplete(result: QueryExecuteBatchNotificationParams): void {
		let batch: BatchSummary = result.batchSummary;

		// Store the batch again to get the rest of the data
		this._batchSets[batch.id] = batch;
		this._totalElapsedMilliseconds += <number>(Utils.parseTimeString(batch.executionElapsed) || 0);
		this.eventEmitter.emit('batchComplete', batch);
	}

	/**
	 * Handle a ResultSetComplete from the service layer
	 */
	public handleResultSetComplete(result: QueryExecuteResultSetCompleteNotificationParams): void {
		let resultSet = result.resultSetSummary;
		let batchSet = this._batchSets[resultSet.batchId];

		// Store the result set in the batch and emit that a result set has completed
		batchSet.resultSetSummaries[resultSet.id] = resultSet;
		this.eventEmitter.emit('resultSet', resultSet);
	}

	/**
	 * Handle a Mssage from the service layer
	 */
	public handleMessage(obj: QueryExecuteMessageParams): void {
		let message = obj.message;
		message.time = new Date(message.time).toLocaleTimeString();

		// Send the message to the results pane
		this.eventEmitter.emit('message', message);
	}

	/**
	 * Get more data rows from the current resultSets from the service layer
	 */
	public getQueryRows(rowStart: number, numberOfRows: number, batchIndex: number, resultSetIndex: number): Thenable<QueryExecuteSubsetResult> {
		const self = this;
		let rowData: QueryExecuteSubsetParams = <QueryExecuteSubsetParams> {
			ownerUri: this.uri,
			resultSetIndex: resultSetIndex,
			rowsCount: numberOfRows,
			rowsStartIndex: rowStart,
			batchIndex: batchIndex
		};

		return new Promise<QueryExecuteSubsetResult>((resolve, reject) => {
			self._queryManagementService.getQueryRows(rowData).then(result => {
				if (result.message) {
					// TODO localize
					self._messageService.show(Severity.Error, 'Something went wrong getting more rows: ' + result.message);
					reject();
				} else {
					resolve(result);
				}
			});
		});
	}

	/**
	 * Disposes the Query from the service client
	 * @returns A promise that will be rejected if a problem occured
	 */
	public dispose(): Promise<void> {
		const self = this;
		return new Promise<void>((resolve, reject) => {
			self._queryManagementService.disposeQuery(self.uri).then(result => {
				resolve();
			}, error => {
				self._messageService.show(Severity.Error, 'Failed disposing query: ' + error);
				reject();
			});
		});
	}

	get totalElapsedMilliseconds(): number {
		return this._totalElapsedMilliseconds;
	}
}
