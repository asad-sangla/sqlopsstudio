/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as GridContentEvents from 'sql/parts/grid/common/gridContentEvents';
import Constants = require('sql/parts/query/common/constants');
import Utils = require('sql/parts/connection/common/utils');
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { DataService } from 'sql/parts/grid/services/dataService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { QueryStatusbarItem } from 'sql/parts/query/execution/queryStatus';
import { SqlFlavorStatusbarItem } from 'sql/parts/query/common/flavorStatus';

import {
	ISelectionData, ResultSetSubset, EditSubsetResult,
	EditUpdateCellResult, EditSessionReadyParams, EditCreateRowResult, EditRevertCellResult
} from 'data';
import { ISlickRange } from 'angular2-slickgrid';

import nls = require('vs/nls');
import statusbar = require('vs/workbench/browser/parts/statusbar/statusbar');
import platform = require('vs/platform/platform');
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService, Severity } from 'vs/platform/message/common/message';
import Event, { Emitter } from 'vs/base/common/event';
import { TPromise } from 'vs/base/common/winjs.base';

interface QueryEvent {
	type: string;
	data: any;
}

/**
 * Holds information about the state of a query runner
 */
class QueryInfo {
	public queryRunner: QueryRunner;
	public dataService: DataService;
	public queryEventQueue: QueryEvent[];
	public selection: ISelectionData;
	public queryInput: QueryInput;

	// Notes if the angular components have obtained the DataService. If not, all messages sent
	// via the data service will be lost.
	public dataServiceReady: boolean;

	constructor() {
		this.dataServiceReady = false;
		this.queryEventQueue = [];
	}
}

/**
 * Handles running queries and grid interactions for all URIs. Interacts with each URI's results grid via a DataService instance
 */
export class QueryModelService implements IQueryModelService {
	_serviceBrand: any;

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _queryInfoMap: Map<string, QueryInfo>;
	private _onRunQueryStart: Emitter<string>;
	private _onRunQueryComplete: Emitter<string>;
	private _onEditSessionReady: Emitter<EditSessionReadyParams>;

	// EVENTS /////////////////////////////////////////////////////////////
	public get onRunQueryStart(): Event<string> { return this._onRunQueryStart.event; }
	public get onRunQueryComplete(): Event<string> { return this._onRunQueryComplete.event; }
	public get onEditSessionReady(): Event<EditSessionReadyParams> { return this._onEditSessionReady.event; }

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IMessageService private _messageService: IMessageService
	) {
		this._queryInfoMap = new Map<string, QueryInfo>();
		this._onRunQueryStart = new Emitter<string>();
		this._onRunQueryComplete = new Emitter<string>();
		this._onEditSessionReady = new Emitter<EditSessionReadyParams>();

		// Register Statusbar items
		(<statusbar.IStatusbarRegistry>platform.Registry.as(statusbar.Extensions.Statusbar)).registerStatusbarItem(new statusbar.StatusbarItemDescriptor(
			QueryStatusbarItem,
			statusbar.StatusbarAlignment.RIGHT,
			100 /* High Priority */
		));
		(<statusbar.IStatusbarRegistry>platform.Registry.as(statusbar.Extensions.Statusbar)).registerStatusbarItem(new statusbar.StatusbarItemDescriptor(
			SqlFlavorStatusbarItem,
			statusbar.StatusbarAlignment.RIGHT,
			90 /* Should appear to the right of the SQL editor status */
		));

	}

	// IQUERYMODEL /////////////////////////////////////////////////////////
	public getDataService(uri: string): DataService {
		let dataService = this._getQueryInfo(uri).dataService;
		if (!dataService) {
			throw new Error('Could not find data service for uri: ' + uri);
		}

		return dataService;
	}

	/**
	 * Force all grids to re-render. This is needed to re-render the grids when switching
	 * between different URIs.
	 */
	public refreshResultsets(uri: string): void {
		this._fireGridContentEvent(uri, GridContentEvents.RefreshContents);
	}

	/**
	 * Resize the grid UI to fit the current screen size.
	 */
	public resizeResultsets(uri: string): void {
		this._fireGridContentEvent(uri, GridContentEvents.ResizeContents);
	}

	public sendGridContentEvent(uri: string, eventName: string): void {
		this._fireGridContentEvent(uri, eventName);
	}

	/**
	 * To be called by an angular component's DataService when the component has finished loading.
	 * Sends all previously enqueued query events to the DataService and signals to stop enqueuing
	 * any further events. This prevents QueryEvents from getting lost if they are sent before
	 * angular is listening for them.
	 */
	public onAngularLoaded(uri: string) {
		let info = this._getQueryInfo(uri);
		info.dataServiceReady = true;
		this._sendQueuedEvents(uri);
	}

	/**
	 * Get more data rows from the current resultSets from the service layer
	 */
	public getQueryRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset> {
		return this._getQueryInfo(uri).queryRunner.getQueryRows(rowStart, numberOfRows, batchId, resultId).then(results => {
			return results.resultSubset;
		});
	}

	public getEditRows(uri: string, rowStart: number, numberOfRows: number): Thenable<EditSubsetResult> {
		return this._queryInfoMap.get(uri).queryRunner.getEditRows(rowStart, numberOfRows).then(results => {
			return results;
		});
	}

	public getConfig(): Promise<{ [key: string]: any }> {
		return undefined;
	}

	public getShortcuts(): Promise<any> {
		return undefined;
	}

	public copyResults(uri: string, selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void {
		this._queryInfoMap.get(uri).queryRunner.copyResults(selection, batchId, resultId, includeHeaders);
	}

	public setEditorSelection(uri: string): void {
		let info: QueryInfo = this._queryInfoMap.get(uri);
		if (info) {
			info.queryInput.updateSelection(info.selection);
		}
	}

	public showWarning(uri: string, message: string): void {
	}

	public showError(uri: string, message: string): void {
	}

	public isRunningQuery(uri: string): boolean {
		return !this._queryInfoMap.has(uri)
			? false
			: this._getQueryInfo(uri).queryRunner.isExecuting;
	}

	/**
	 * Run a query for the given URI with the given text selection
	 */
	public runQuery(uri: string, selection: ISelectionData, title: string, queryInput: QueryInput): void {
		// Reuse existing query runner if it exists
		let queryRunner: QueryRunner;
		let info: QueryInfo;

		if (this._queryInfoMap.has(uri)) {
			info = this._getQueryInfo(uri);
			let existingRunner: QueryRunner = info.queryRunner;

			// If the query is already in progress, don't attempt to send it
			if (existingRunner.isExecuting) {
				return;
			}

			// If the query is not in progress, we can reuse the query runner
			queryRunner = existingRunner;
		} else {
			// We do not have a query runner for this editor, so create a new one
			// and map it to the results uri
			queryRunner = this._instantiationService.createInstance(QueryRunner, uri, title);
			queryRunner.eventEmitter.on('resultSet', (resultSet) => {
				this._fireQueryEvent(uri, 'resultSet', resultSet);
			});
			queryRunner.eventEmitter.on('batchStart', (batch) => {
				let link = undefined;
				if (batch.selection) {
					link = {
						text: Utils.formatString(Constants.runQueryBatchStartLine, batch.selection.startLine + 1)
					};
				}
				let message = {
					message: Constants.runQueryBatchStartMessage,
					batchId: undefined,
					isError: false,
					time: new Date().toLocaleTimeString(),
					link: link
				};
				this._fireQueryEvent(uri, 'message', message);
				info.selection = this._validateSelection(batch.selection);
			});
			queryRunner.eventEmitter.on('message', (message) => {
				this._fireQueryEvent(uri, 'message', message);
			});
			queryRunner.eventEmitter.on('complete', (totalMilliseconds) => {
				this._onRunQueryComplete.fire(uri);
				this._fireQueryEvent(uri, 'complete', totalMilliseconds);
			});
			queryRunner.eventEmitter.on('start', () => {
				this._onRunQueryStart.fire(uri);
				this._fireQueryEvent(uri, 'start');
			});

			info = new QueryInfo();
			info.queryRunner = queryRunner;
			info.dataService = this._instantiationService.createInstance(DataService, uri);
			this._queryInfoMap.set(uri, info);
		}

		info.queryInput = queryInput;
		queryRunner.runQuery(selection);
	}

	public cancelQuery(input: QueryRunner | string): void {
		let queryRunner: QueryRunner;

		if (typeof input === 'string') {
			if (this._queryInfoMap.has(input)) {
				queryRunner = this._getQueryInfo(input).queryRunner;
			}
		} else {
			queryRunner = input;
		}

		if (queryRunner === undefined || !queryRunner.isExecuting) {
			// TODO: Cannot cancel query as no query is running.
			return;
		}

		// Switch the spinner to canceling, which will be reset when the query execute sends back its completed event
		// TODO indicate on the status bar that the query is being canceled

		// Cancel the query
		queryRunner.cancelQuery().then(success => undefined, error => {
			// On error, show error message and notify that the query is complete so that buttons and other status indicators
			// can be correct
			this._messageService.show(Severity.Error, Utils.formatString(Constants.msgCancelQueryFailed, error));
			this._fireQueryEvent(queryRunner.uri, 'complete', 0);
		});

	}

	public disposeQuery(ownerUri: string): Thenable<void> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.dispose();
		}
		return TPromise.as(null);
	}

	// EDIT DATA METHODS /////////////////////////////////////////////////////
	initializeEdit(ownerUri: string, schemaName: string, objectName: string, objectType: string, rowLimit: number): void {
		// Reuse existing query runner if it exists
		let queryRunner: QueryRunner;
		let info: QueryInfo;

		if (this._queryInfoMap.has(ownerUri)) {
			info = this._getQueryInfo(ownerUri);
			let existingRunner: QueryRunner = info.queryRunner;

			// If the initialization is already in progress
			if (existingRunner.isExecuting) {
				return;
			}

			queryRunner = existingRunner;
		} else {
			// We do not have a query runner for this editor, so create a new one
			// and map it to the results uri
			queryRunner = this._instantiationService.createInstance(QueryRunner, ownerUri, ownerUri);
			queryRunner.eventEmitter.on('resultSet', (resultSet) => {
				this._fireQueryEvent(ownerUri, 'resultSet', resultSet);
			});
			queryRunner.eventEmitter.on('batchStart', (batch) => {
				let link = undefined;
				if (batch.selection) {
					link = {
						text: Utils.formatString(Constants.runQueryBatchStartLine, batch.selection.startLine + 1),
						uri: ''
					};
				}
				let message = {
					message: Constants.runQueryBatchStartMessage,
					batchId: undefined,
					isError: false,
					time: new Date().toLocaleTimeString(),
					link: link
				};
				this._fireQueryEvent(ownerUri, 'message', message);
			});
			queryRunner.eventEmitter.on('message', (message) => {
				this._fireQueryEvent(ownerUri, 'message', message);
			});
			queryRunner.eventEmitter.on('complete', (totalMilliseconds) => {
				this._onRunQueryComplete.fire(ownerUri);
				this._fireQueryEvent(ownerUri, 'complete', totalMilliseconds);
			});
			queryRunner.eventEmitter.on('start', () => {
				this._onRunQueryStart.fire(ownerUri);
				this._fireQueryEvent(ownerUri, 'start');
			});
			queryRunner.eventEmitter.on('editSessionReady', (ownerUri, success, message) => {
				this._onEditSessionReady.fire({ ownerUri: ownerUri, success: success, message: message });
				this._fireQueryEvent(ownerUri, 'editSessionReady');
			});

			info = new QueryInfo();
			info.queryRunner = queryRunner;
			info.dataService = this._instantiationService.createInstance(DataService, ownerUri);
			this._queryInfoMap.set(ownerUri, info);
		}

		queryRunner.initializeEdit(ownerUri, schemaName, objectName, objectType, rowLimit);
	}

	public cancelInitializeEdit(input: QueryRunner | string): void {
		// TODO: Implement query cancellation service
	}

	public disposeEdit(ownerUri: string): Thenable<void> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.disposeEdit(ownerUri);
		}
		return TPromise.as(null);
	}

	public updateCell(ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<EditUpdateCellResult> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.updateCell(ownerUri, rowId, columnId, newValue).then((result) => result, error => {
				this._messageService.show(Severity.Error, nls.localize('updateCellFailed', 'Update cell failed: ') + error.message);
				return Promise.reject(error);
			});
		}
		return TPromise.as(null);
	}

	public commitEdit(ownerUri): Thenable<void> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.commitEdit(ownerUri).then(() => { }, error => {
				this._messageService.show(Severity.Error, nls.localize('commitEditFailed', 'Commit row failed: ') + error.message);
				return Promise.reject(error);
			});
		}
		return TPromise.as(null);
	}

	public createRow(ownerUri: string): Thenable<EditCreateRowResult> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.createRow(ownerUri);
		}
		return TPromise.as(null);
	}

	public deleteRow(ownerUri: string, rowId: number): Thenable<void> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.deleteRow(ownerUri, rowId);
		}
		return TPromise.as(null);
	}

	public revertCell(ownerUri: string, rowId: number, columnId: number): Thenable<EditRevertCellResult> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.revertCell(ownerUri, rowId, columnId);
		}
		return TPromise.as(null);
	}

	public revertRow(ownerUri: string, rowId: number): Thenable<void> {
		// Get existing query runner
		let queryRunner = this._getQueryRunner(ownerUri);
		if (queryRunner) {
			return queryRunner.revertRow(ownerUri, rowId);
		}
		return TPromise.as(null);
	}

	// PRIVATE METHODS //////////////////////////////////////////////////////

	private _getQueryRunner(ownerUri): QueryRunner {
		let queryRunner: QueryRunner = undefined;
		if (this._queryInfoMap.has(ownerUri)) {
			let existingRunner = this._getQueryInfo(ownerUri).queryRunner;
			// If the query is not already executing then set it up
			if (!existingRunner.isExecuting) {
				queryRunner = this._getQueryInfo(ownerUri).queryRunner;
			}
		}
		// return undefined if not found or is already executing
		return queryRunner;
	}

	private _fireGridContentEvent(uri: string, type: string): void {
		let info: QueryInfo = this._getQueryInfo(uri);

		if (info && info.dataServiceReady) {
			let service: DataService = this.getDataService(uri);
			if (service) {
				// There is no need to queue up these events like there is for the query events because
				// if the DataService is not yet ready there will be no grid content to update
				service.gridContentObserver.next(type);
			}
		}
	}

	private _fireQueryEvent(uri: string, type: string, data?: any) {
		let info: QueryInfo = this._getQueryInfo(uri);

		if (info.dataServiceReady) {
			let service: DataService = this.getDataService(uri);
			service.queryEventObserver.next({
				type: type,
				data: data
			});
		} else {
			let queueItem: QueryEvent = { type: type, data: data };
			info.queryEventQueue.push(queueItem);
		}
	}

	private _sendQueuedEvents(uri: string): void {
		let info: QueryInfo = this._getQueryInfo(uri);
		while (info.queryEventQueue.length > 0) {
			let event: QueryEvent = info.queryEventQueue.shift();
			this._fireQueryEvent(uri, event.type, event.data);
		}
	}

	private _getQueryInfo(uri: string): QueryInfo {
		return this._queryInfoMap.get(uri);
	}

	// TODO remove this funciton and its usages when #821 in vscode-mssql is fixed and
	// the SqlToolsService version is updated in this repo - coquagli 4/19/2017
	private _validateSelection(selection: ISelectionData): ISelectionData {
		if (!selection) {
			selection = <ISelectionData>{};
		}
		selection.endColumn = selection ? Math.max(0, selection.endColumn) : 0;
		selection.endLine = selection ? Math.max(0, selection.endLine) : 0;
		selection.startColumn = selection ? Math.max(0, selection.startColumn) : 0;
		selection.startLine = selection ? Math.max(0, selection.startLine) : 0;
		return selection;
	}
}
