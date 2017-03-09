/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDbColumn, ISelectionData, IResultMessage } from 'sql/parts/connection/node/interfaces';

export class ResultSetSummary {
	id: number;
	batchId: number;
	rowCount: number;
	columnInfo: IDbColumn[];
}

export class BatchSummary {
	hasError: boolean;
	id: number;
	selection: ISelectionData;
	resultSetSummaries: ResultSetSummary[];
	executionElapsed: string;
	executionEnd: string;
	executionStart: string;
}

export class QueryDisposeParams {
	ownerUri: string;
}

export class QueryDisposeResult {
	messages: string;
}

export class QueryExecuteCompleteNotificationResult {
	ownerUri: string;
	batchSummaries: BatchSummary[];
}

export class QueryExecuteBatchNotificationParams {
	batchSummary: BatchSummary;
	ownerUri: string;
}

export class QueryExecuteResultSetCompleteNotificationParams {
	resultSetSummary: ResultSetSummary;
	ownerUri: string;
}

export class QueryExecuteMessageParams {
	message: IResultMessage;
	ownerUri: string;
}

export class QueryExecuteParams {
	ownerUri: string;
	querySelection: ISelectionData;
}

export class QueryExecuteResult { }

export class QueryExecuteSubsetParams {
	ownerUri: string;
	batchIndex: number;
	resultSetIndex: number;
	rowsStartIndex: number;
	rowsCount: number;
}

export class ResultSetSubset {
	rowCount: number;
	rows: any[][];
}

export class QueryExecuteSubsetResult {
	message: string;
	resultSubset: ResultSetSubset;
}
