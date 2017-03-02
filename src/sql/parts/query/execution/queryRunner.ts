/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { QueryCancelParams, QueryCancelResult } from 'sql/parts/query/execution/contracts/queryCancel';
import { BatchSummary,
    QueryExecuteCompleteNotificationResult,
    QueryExecuteSubsetResult,
    QueryExecuteResultSetCompleteNotificationParams,
    QueryExecuteSubsetParams,
    QueryExecuteMessageParams,
    QueryExecuteBatchNotificationParams } from 'sql/parts/query/execution/contracts/queryExecute';
import { EventEmitter } from 'events';
import { ISelectionData } from 'sql/parts/connection/node/interfaces';
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

    constructor (private _ownerUri: string, private _editorTitle: string) {

        // Store the state
        this._uri = _ownerUri;
        this._title = _editorTitle;
        this._isExecuting = false;
        this._totalElapsedMilliseconds = 0;
        this._hasCompleted = false;
    }

	// TEST FUNCTIONS //////////////////////////////////////////////////////

    private _TEST_getTestColumn(colName: string): any {
        return {
            baseCatalogName: null,
            baseColumnName: null,
            baseSchemaName: null,
            baseServerName: null,
            baseTableName: null,
            columnName: colName,
            udtAssemblyQualifiedName: null,
            dataType: 'System.String, System.Private.CoreLib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e',
            dataTypeName: 'nvarchar'
        };
    }

    public TEST_setupRunQuery(): void {
		const self = this;
        let currentTime = 500;

		setTimeout(function() {
			let test = {
				ownerUri: this._uri,
				batchSummary: {
					hasError: false,
					id: 0,
					selection: {
						startLine: 1,
						startColumn: 2,
						endLine: 3,
						endColumn: 3
					},
					resultSetSummaries: undefined,
					executionElapsed: '',
					executionEnd: '',
					executionStart: ''
				}
			};
			self.handleBatchStart(test);

		}, currentTime+=200);

		setTimeout(function() {
			let test = {
				ownerUri: this._uri,
				message: {
					isError: false,
                    batchId: 0,
					time: new Date().toLocaleString(),
					message: '(5 rows affected)',
				}
			};
			self.handleMessage(test);

		}, 700);

		setTimeout(function() {
			let test = {
			    ownerUri: this._uri,
		    	resultSetSummary: {
					batchId: 0,
					id: 0,
					rowCount: 5,
					columnInfo: [self._TEST_getTestColumn('col1'), self._TEST_getTestColumn('col2'), self._TEST_getTestColumn('col3')]
				}
			};
			self.handleResultSetComplete(test);

		}, currentTime+=200);

        setTimeout(function() {
			let test = {
				ownerUri: this._uri,
				message: {
					isError: false,
                    batchId: 0,
					time: new Date().toLocaleString(),
					message: '(5 rows affected)',
				}
			};
			self.handleMessage(test);

		}, 700);

		setTimeout(function() {
			let test = {
			    ownerUri: this._uri,
		    	resultSetSummary: {
					batchId: 0,
					id: 0,
					rowCount: 5,
					columnInfo: [self._TEST_getTestColumn('col1'), self._TEST_getTestColumn('col2'), self._TEST_getTestColumn('col3')]
				}
			};
			self.handleResultSetComplete(test);

		}, currentTime+=200);

		setTimeout(function() {
			let test = {
			    ownerUri: this._uri,
				batchSummary: {
					hasError: false,
					id: 0,
					selection: {
						startLine: 1,
						startColumn: 2,
						endLine: 3,
						endColumn: 3
					},
					resultSetSummaries: undefined,
					executionElapsed: '00:00:00.55',
					executionEnd: '',
					executionStart: ''
				}
			};
			self.handleBatchComplete(test);

		}, currentTime+=200);

		setTimeout(function() {
			let test = {
			    ownerUri: this._uri,
				batchSummaries: [{
					hasError: false,
					id: 0,
					selection: {
						startLine: 1,
						startColumn: 2,
						endLine: 3,
						endColumn: 3
					},
					resultSetSummaries: undefined,
					executionElapsed: '00:00:00.45',
					executionEnd: '',
					executionStart: ''
				}]
			};
			self.handleQueryComplete(test);

		}, currentTime+=200);
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
        let cancelParams: QueryCancelParams = { ownerUri: this._uri };
		return new Promise<QueryCancelResult>((resolve, reject) => {
		});
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

        // Send the request to execute the query
		return new Promise<void>((resolve, reject) => {
			self.eventEmitter.emit('start');
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
    public getRows(rowStart: number, numberOfRows: number, batchIndex: number, resultSetIndex: number): Thenable<QueryExecuteSubsetResult> {
        let queryDetails = new QueryExecuteSubsetParams();
        queryDetails.ownerUri = this.uri;
        queryDetails.resultSetIndex = resultSetIndex;
        queryDetails.rowsCount = numberOfRows;
        queryDetails.rowsStartIndex = rowStart;
        queryDetails.batchIndex = batchIndex;

        return new Promise<QueryExecuteSubsetResult>((resolve, reject) => {
            let colCount = 3;
            let rows = [];
            for(let r = 0; r < numberOfRows; r ++) {
                let row = [];
                for(let c = 0; c < colCount; c ++) {
                    row.push('row: ' + r + ', col: ' + c);
                }
                rows.push(row);
            }

            let val = {
					message: 'result subset',
					resultSubset: {
					rowCount: numberOfRows,
					rows: rows
				}
            };
            resolve(val);
        });
    }

    /**
     * Disposes the Query from the service client
     * @returns A promise that will be rejected if a problem occured
     */
    public dispose(): Promise<void> {
		return undefined;
    }

    get totalElapsedMilliseconds(): number {
        return this._totalElapsedMilliseconds;
    }
}
