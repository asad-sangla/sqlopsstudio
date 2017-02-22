/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Constants = require('sql/parts/connection/node/constants');
import Utils = require('sql/parts/connection/node/utils');
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { ISelectionData } from 'sql/parts/connection/node/interfaces';
import { DataService } from 'sql/parts/grid/services/dataService';
import { ISlickRange } from 'angular2-slickgrid';
import { ResultSetSubset } from 'sql/parts/query/execution/contracts/queryExecute';

/**
 * Holds information about the state of a query runner
 */
export class QueryRunnerState {
    timeout: number;
    flaggedForDeletion: boolean;
    constructor (public queryRunner: QueryRunner) {
        this.flaggedForDeletion = false;
    }
}

/**
 * Interface for the logic of handling running queries and grid interactions for all URIs.
 */
export interface IQueryModel {
    registerDataService(uri: string, service: DataService): void;

    getConfig(): Promise<{[key: string]: any}>;
    getShortcuts(): Promise<any>;
    getRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset>;

    save(uri: string, batchIndex: number, resultSetNumber: number, format: string, selection: ISlickRange[]): void;
    openLink(uri: string, content: string, columnName: string, linkType: string): void;
    copyResults(uri: string, selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void;
    setEditorSelection(uri: string, selection: ISelectionData): void;
    showWarning(uri: string, message: string): void;
    showError(uri: string, message: string): void;
}

/**
 * Handles running queries and grid interactions for all URIs. Interacts with each URI's results grid via a DataService instance
 */
export class QueryModel implements IQueryModel {

    // MEMBER VARIABLES ////////////////////////////////////////////////////
    private _queryResultsMap: Map<string, QueryRunnerState>;
	private _serviceMap: Map<string, DataService>;

    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor() {
        this._queryResultsMap = new Map<string, QueryRunnerState>();
        this._serviceMap = new Map<string, DataService>();
    }

    // IQUERYMODEL /////////////////////////////////////////////////////////

    /**
     * Called by a DataService instance upon angular startup
     */
    public registerDataService(uri: string, service: DataService): void {
        this._serviceMap.set(uri, service);

        // run a test query upon registration TODO remove this
        const self = this;
        setTimeout(function(){
            self.runQuery(uri, undefined, Constants.testUri);
        }, 500);
    }

    /**
     * Get more data rows from the current resultSets from the service layer
     */
    public getRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset> {
        return this._queryResultsMap.get(uri).queryRunner.getRows(rowStart, numberOfRows, batchId, resultId).then(results => {
            return results.resultSubset;
        });
    }

    public getConfig(): Promise<{[key: string]: any}> {
        return undefined;
    }

    public getShortcuts(): Promise<any> {
        return undefined;
    }

    public save(uri: string, batchIndex: number, resultSetNumber: number, format: string, selection: ISlickRange[]): void {
    }

    public openLink(uri: string, content: string, columnName: string, linkType: string): void {
    }

    public copyResults(uri: string, selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void {
    }

    public setEditorSelection(uri: string, selection: ISelectionData): void {
    }

    public showWarning(uri: string, message: string): void {
    }

    public showError(uri: string, message: string): void {
    }

    public isRunningQuery(uri: string): boolean {
        return !this._queryResultsMap.has(uri)
            ? false
            : this._queryResultsMap.get(uri).queryRunner.isExecutingQuery;
    }

    /**
     * Run a query for the given URI with the given text selection
     */
    public runQuery(uri: string, selection: ISelectionData, title: string): void {
        // Reuse existing query runner if it exists
        let queryRunner: QueryRunner;

        if (this._queryResultsMap.has(uri)) {
            let existingRunner: QueryRunner = this._queryResultsMap.get(uri).queryRunner;

            // If the query is already in progress, don't attempt to send it
            if (existingRunner.isExecutingQuery) {
                return;
            }

            // If the query is not in progress, we can reuse the query runner
            queryRunner = existingRunner;
        } else {
            // We do not have a query runner for this editor, so create a new one
            // and map it to the results uri
            queryRunner = new QueryRunner(uri, title);
            queryRunner.eventEmitter.on('resultSet', (resultSet) => {
                this.fireQueryEvent(uri, 'resultSet', resultSet);
            });
            queryRunner.eventEmitter.on('batchStart', (batch) => {
                let message = {
                    message: Constants.runQueryBatchStartMessage,
                    batchId: undefined,
                    isError: false,
                    time: new Date().toLocaleTimeString(),
                    link: {
                        text: Utils.formatString(Constants.runQueryBatchStartLine, batch.selection.startLine + 1),
                        uri: ''
                    }
                };
                this.fireQueryEvent(uri, 'message', message);
            });
            queryRunner.eventEmitter.on('message', (message) => {
                this.fireQueryEvent(uri, 'message', message);
            });
            queryRunner.eventEmitter.on('complete', (totalMilliseconds) => {
                this.fireQueryEvent(uri, 'complete', totalMilliseconds);
            });
            queryRunner.eventEmitter.on('start', () => {
            });
            this._queryResultsMap.set(uri, new QueryRunnerState(queryRunner));
        }

        queryRunner.runQuery(selection);
    }

    public cancelQuery(input: QueryRunner | string): void {
    }

    // PRIVATE METHODS //////////////////////////////////////////////////////

    private fireQueryEvent(uri: string, type: string, data: any) {
        let service: DataService = this._serviceMap.get(uri);
        if (service) {
            service.dataEventObs.next({
                type: type,
                data: data
            });
        }
    }
}
