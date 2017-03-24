/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import Constants = require('sql/parts/connection/common/constants');
import Utils = require('sql/parts/connection/common/utils');
import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { DataService } from 'sql/parts/grid/services/dataService';
import { ISlickRange } from 'angular2-slickgrid';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import Event, { Emitter } from 'vs/base/common/event';
import { ISelectionData, ResultSetSubset } from 'data';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';

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
	private _onEditSessionReady: Emitter<{ownerUri: string, success: boolean}>;

	// EVENTS /////////////////////////////////////////////////////////////
	public get onRunQueryStart(): Event<string> { return this._onRunQueryStart.event; }
	public get onRunQueryComplete(): Event<string> { return this._onRunQueryComplete.event; }
	public get onEditSessionReady(): Event<{ownerUri: string, success: boolean}> { return this._onEditSessionReady.event; }

	// CONSTRUCTOR /////////////////////////////////////////////////////////
	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IMessageService private _messageService: IMessageService
	) {
		this._queryInfoMap = new Map<string, QueryInfo>();
		this._onRunQueryStart = new Emitter<string>();
		this._onRunQueryComplete = new Emitter<string>();
		this._onEditSessionReady = new Emitter<{ownerUri: string, success: boolean}>();
	}

	// IQUERYMODEL /////////////////////////////////////////////////////////
	public getDataService(uri: string): DataService {
		let dataService = this._queryInfoMap.get(uri).dataService;
		if (!dataService) {
			throw new Error('Could not find data service for uri: ' + uri);
		}

		return dataService;
	}

	public refreshResultsets(uri: string): void {
		let dataService = this._queryInfoMap.get(uri).dataService;
		if (dataService) {
			dataService.refreshGridsObserver.next();
		}
	}

	/**
	 * To be called by an angular component's DataService when the component has finished loading.
	 * Sends all previously enqueued query events to the DataService and signals to stop enqueuing
	 * any further events. This prevents QueryEvents from getting lost if they are sent before
	 * angular is listening for them.
	 */
	public onAngularLoaded(uri: string) {
		let info = this._queryInfoMap.get(uri);
		info.dataServiceReady = true;
		this._sendQueuedEvents(uri);
	}

	/**
	 * Get more data rows from the current resultSets from the service layer
	 */
	public getRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset> {
		return this._queryInfoMap.get(uri).queryRunner.getQueryRows(rowStart, numberOfRows, batchId, resultId).then(results => {
			return results.resultSubset;
		});
	}

	public getConfig(): Promise<{ [key: string]: any }> {
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
		return !this._queryInfoMap.has(uri)
			? false
			: this._queryInfoMap.get(uri).queryRunner.isExecuting;
	}

	/**
	 * Run a query for the given URI with the given text selection
	 */
	public runQuery(uri: string, selection: ISelectionData, title: string): void {
		// Reuse existing query runner if it exists
		let queryRunner: QueryRunner;
		let info: QueryInfo;

		if (this._queryInfoMap.has(uri)) {
			info = this._queryInfoMap.get(uri);
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
				this._fireQueryEvent(uri, 'message', message);
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
			info.dataService = new DataService(this, uri);
			this._queryInfoMap.set(uri, info);
		}

		queryRunner.runQuery(selection);
	}

	public cancelQuery(input: QueryRunner | string): void {
		let queryRunner: QueryRunner;

		if (typeof input === 'string') {
			if (this._queryInfoMap.has(input)) {
				queryRunner = this._queryInfoMap.get(input).queryRunner;
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

	// EDIT DATA METHODS /////////////////////////////////////////////////////
	initializeEdit(owner: EditDataInput): void {
		// Reuse existing query runner if it exists
		let queryRunner: QueryRunner;
		let info: QueryInfo;
		let ownerUri = owner.uri;

		if (this._queryInfoMap.has(ownerUri)) {
			info = this._queryInfoMap.get(ownerUri);
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
			queryRunner.eventEmitter.on('editSessionReady', (ownerUri, success) => {
				this._onEditSessionReady.fire({ownerUri: ownerUri, success: success});
				this._fireQueryEvent(ownerUri, 'editSessionReady');
			});

			info = new QueryInfo();
			info.queryRunner = queryRunner;
			info.dataService = new DataService(this, ownerUri);
			this._queryInfoMap.set(ownerUri, info);
		}

		queryRunner.initializeEdit(ownerUri, owner.tableName, 'TABLE');
	}

	public cancelInitializeEdit(input: QueryRunner | string): void {
		// TODO: Implement query cancellation service
	}

	public disposeEdit(owner: EditDataInput): void {
		// TODO: Implement edit session disposal service
	}

	// PRIVATE METHODS //////////////////////////////////////////////////////

	private _fireQueryEvent(uri: string, type: string, data?: any) {
		let info: QueryInfo = this._queryInfoMap.get(uri);

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
		let info: QueryInfo = this._queryInfoMap.get(uri);
		while (info.queryEventQueue.length > 0) {
			let event: QueryEvent = info.queryEventQueue.shift();
			this._fireQueryEvent(uri, event.type, event.data);
		}
	}
}
