/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');

import { Action} from 'vs/base/common/actions';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';

/**
 * Locates the active editor and calls runQuery() on the editor if it is a QueryEditor.
 */
export class RunQueryKeyboardAction extends Action {

	public static ID = 'runQueryKeyboardAction';
	public static LABEL = nls.localize('runQueryKeyboardAction', 'Run Query');

	constructor(
		id: string,
		label: string,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService
	) {
		super(id, label);
		this.enabled = true;
	}

	public run(): TPromise<void> {
		let editor = this._editorService.getActiveEditor();
		if (editor && editor instanceof QueryEditor) {
			let queryEditor: QueryEditor = editor;
			queryEditor.runQuery();
		}
		return TPromise.as(null);
	}
}

/**
 * Locates the active editor and calls cancelQuery() on the editor if it is a QueryEditor.
 */
export class CancelQueryKeyboardAction extends Action {

	public static ID = 'cancelQueryKeyboardAction';
	public static LABEL = nls.localize('cancelQueryKeyboardAction', 'Cancel Query');

	constructor(
		id: string,
		label: string,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService
	) {
		super(id, label);
		this.enabled = true;
	}

	public run(): TPromise<void> {
		let editor = this._editorService.getActiveEditor();
		if (editor && editor instanceof QueryEditor) {
			let queryEditor: QueryEditor = editor;
			queryEditor.cancelQuery();
		}
		return TPromise.as(null);
	}
}
