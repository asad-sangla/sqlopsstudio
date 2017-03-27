/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Observable, Subject, Observer } from 'rxjs/Rx';
declare let Rx;

import { ISlickRange } from 'angular2-slickgrid';
import { ISelectionData, ResultSetSubset, EditUpdateCellResult } from 'data';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';

/**
 * DataService handles the interactions between QueryModel and app.component. Thus, it handles
 * query running and grid interaction communication for a single URI.
 */
export class DataService {
	public queryEventObserver: Subject<any>;
	public gridContentObserver: Subject<any>;
	private editQueue: Promise<any>;

	constructor(private _queryModel: IQueryModelService, private _uri: string) {
		this.queryEventObserver = new Rx.Subject();
		this.gridContentObserver = new Rx.Subject();
		this.editQueue = Promise.resolve();
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

	updateCell(rowId: number, columnId: number, newValue: string): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.updateCell(self._uri, rowId, columnId, newValue);
		});
	}

	commitEdit(): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.commitEdit(self._uri);
		});
	}

	createRow(): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.createRow(self._uri);
		});
	}

	deleteRow(rowId: number): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.deleteRow(self._uri, rowId);
		});
	}

	revertCell(rowId: number, columnId: number): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.revertCell(self._uri, rowId, columnId);
		});
	}

	revertRow(rowId: number): void {
		const self = this;
		self.editQueue = self.editQueue.then(() => {
			self._queryModel.revertRow(self._uri, rowId);
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

	showWarning(message: string): void {
	}

	showError(message: string): void {
	}

	get config(): Promise<{ [key: string]: any }> {
		return undefined;
	}

	onAngularLoaded(): void {
		this._queryModel.onAngularLoaded(this._uri);
	}
}
