/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Observable, Subject, Observer } from 'rxjs/Rx';
declare let Rx;

import { ISlickRange } from 'angular2-slickgrid';
import { ISelectionData } from 'sql/parts/connection/node/interfaces';
import { IQueryModel } from 'sql/parts/query/execution/queryModel';
import { ResultSetSubset } from 'sql/parts/query/execution/contracts/queryExecute';

/**
 * DataService handles the interactions between QueryModel and app.component. Thus, it handles
 * query running and grid interaction communication for a single URI.
 */
export class DataService {
    public dataEventObs: Subject<any>;

    constructor(private _queryModel: IQueryModel, private _uri: string) {
      this.dataEventObs = new Rx.Subject();
    }

    /**
     * Get a specified number of rows starting at a specified row for
     * the current results set
     * @param start The starting row or the requested rows
     * @param numberOfRows The amount of rows to return
     * @param batchId The batch id of the batch you are querying
     * @param resultId The id of the result you want to get the rows for
     */
    getRows(rowStart: number, numberOfRows: number, batchId: number, resultId: number): Observable<ResultSetSubset> {
      const self = this;
      return Rx.Observable.create(function (observer: Observer<ResultSetSubset>) {
        self._queryModel.getRows(self._uri, rowStart, numberOfRows, batchId, resultId).then(results => {
            observer.next(results);
        });
      });
    }

    /**
     * send request to save the selected result set as csv
     * @param uri of the calling document
     * @param batchId The batch id of the batch with the result to save
     * @param resultId The id of the result to save as csv
     */
    sendSaveRequest(batchIndex: number, resultSetNumber: number, format: string, selection: ISlickRange[]): void {
    }

    /**
     * send request to open content in new editor
     * @param content The content to be opened
     * @param columnName The column name of the content
     */
    openLink(content: string, columnName: string, linkType: string): void {
    }

    /**
     * Sends a copy request
     * @param selection The selection range to copy
     * @param batchId The batch id of the result to copy from
     * @param resultId The result id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void {
    }

    /**
     * Sends a request to set the selection in the VScode window
     * @param selection The selection range in the VSCode window
     */
    set editorSelection(selection: ISelectionData) {
    }

    /**
     * Sends a generic GET request without expecting anything in return
     * @param uri The uri to send the GET request to
     */
    sendGetRequest(uri: string): void {
    }

    showWarning(message: string): void {
    }

    showError(message: string): void {
    }

    get config(): Promise<{[key: string]: any}> {
		return undefined;
    }
}
