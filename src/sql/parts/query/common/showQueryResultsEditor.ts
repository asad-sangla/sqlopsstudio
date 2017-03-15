/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectableEditor } from 'sql/parts/connection/common/connectionManagement';

/*
 * This interface is used to help avoid a circular dependency between QueryEditor and QueryAction.
 */
export interface IShowQueryResultsEditor extends IConnectableEditor {
	uri: string;

	showQueryResultsEditor(): void;
}