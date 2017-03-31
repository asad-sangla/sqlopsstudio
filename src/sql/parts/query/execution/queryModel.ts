/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { DataService } from 'sql/parts/grid/services/dataService';
import { ISlickRange } from 'angular2-slickgrid';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import Event from 'vs/base/common/event';
import {
	ISelectionData,
	ResultSetSubset,
	EditUpdateCellResult,
	EditSessionReadyParams,
	EditSubsetResult
} from 'data';

export const SERVICE_ID = 'queryModelService';

export const IQueryModelService = createDecorator<IQueryModelService>(SERVICE_ID);

/**
 * Interface for the logic of handling running queries and grid interactions for all URIs.
 */
export interface IQueryModelService {
	_serviceBrand: any;

	getConfig(): Promise<{ [key: string]: any }>;
	getShortcuts(): Promise<any>;
	getQueryRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset>;
	runQuery(uri: string, selection: ISelectionData, title: string): void;
	cancelQuery(input: QueryRunner | string): void;
	isRunningQuery(uri: string): boolean;

	getDataService(uri: string): DataService;
	refreshResultsets(uri: string): void;
	resizeResultsets(uri: string): void;
	onAngularLoaded(uri: string): void;

	save(uri: string, batchIndex: number, resultSetNumber: number, format: string, selection: ISlickRange[]): void;
	openLink(uri: string, content: string, columnName: string, linkType: string): void;
	copyResults(uri: string, selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void;
	setEditorSelection(uri: string, selection: ISelectionData): void;
	showWarning(uri: string, message: string): void;
	showError(uri: string, message: string): void;

	onRunQueryStart: Event<string>;
	onRunQueryComplete: Event<string>;


	// Edit Data Functions
	initializeEdit(ownerUri: string, objectName: string, objectType: string, rowLimit: number): void;
	disposeEdit(ownerUri: string): Thenable<void>;
	updateCell(ownerUri: string, rowId: number, columnId: number, newValue: string): Thenable<EditUpdateCellResult>;
	commitEdit(ownerUri): Thenable<void>;
	createRow(ownerUri: string): void;
	deleteRow(ownerUri: string, rowId: number): void;
	revertCell(ownerUri: string, rowId: number, columnId: number): void;
	revertRow(ownerUri: string, rowId: number): void;
	getEditRows(ownerUri: string, rowStart: number, numberOfRows: number): Thenable<EditSubsetResult>;

	// Edit Data Callbacks
	onEditSessionReady: Event<EditSessionReadyParams>;
}
