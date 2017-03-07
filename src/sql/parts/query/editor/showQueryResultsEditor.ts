/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// This file is used to help avoid a circular dependency between QueryEditor and QueryAction.

export interface IShowQueryResultsEditor {
	showQueryResultsEditor(): void;
	uri: string;
}

export function isInstanceOfIQueryEditor(object: any): object is IShowQueryResultsEditor {
	return 'showQueryResultsEditor' in object;
}