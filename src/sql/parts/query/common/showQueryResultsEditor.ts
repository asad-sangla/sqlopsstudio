/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectableEditor } from 'sql/parts/connection/common/connectionManagement';
import { IEditor } from 'vs/platform/editor/common/editor';

/*
 * This interface is used to help avoid a circular dependency between QueryEditor and QueryAction.
 */
export interface IShowQueryResultsEditor extends IConnectableEditor, IEditor {
	uri: string;

	showQueryResultsEditor(): void;
}