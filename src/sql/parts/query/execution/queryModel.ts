/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import QueryRunner from 'sql/parts/query/execution/queryRunner';
import { ISelectionData } from 'sql/parts/connection/node/interfaces';
import { DataService } from 'sql/parts/grid/services/dataService';
import { ISlickRange } from 'angular2-slickgrid';
import { ResultSetSubset } from 'sql/parts/query/execution/contracts/queryExecute';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import Event from 'vs/base/common/event';

export const SERVICE_ID = 'queryModelService';

export const IQueryModelService = createDecorator<IQueryModelService>(SERVICE_ID);

/**
 * Interface for the logic of handling running queries and grid interactions for all URIs.
 */
export interface IQueryModelService {
    getConfig(): Promise<{[key: string]: any}>;
    getShortcuts(): Promise<any>;
    getRows(uri: string, rowStart: number, numberOfRows: number, batchId: number, resultId: number): Thenable<ResultSetSubset>;
    runQuery(uri: string, selection: ISelectionData, title: string): void;
    cancelQuery(input: QueryRunner | string): void;

    getDataService(uri: string): DataService;
    onAngularLoaded(uri: string): void;

    save(uri: string, batchIndex: number, resultSetNumber: number, format: string, selection: ISlickRange[]): void;
    openLink(uri: string, content: string, columnName: string, linkType: string): void;
    copyResults(uri: string, selection: ISlickRange[], batchId: number, resultId: number, includeHeaders?: boolean): void;
    setEditorSelection(uri: string, selection: ISelectionData): void;
    showWarning(uri: string, message: string): void;
    showError(uri: string, message: string): void;

	onRunQueryStart: Event<string>;
	onRunQueryComplete: Event<string>;

    TEST_sendDummyQueryEvents(uri: string): void;
}