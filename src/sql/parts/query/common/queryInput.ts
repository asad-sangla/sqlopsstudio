/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel } from 'vs/workbench/common/editor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { QueryResultsInput } from './queryResultsInput';

/**
 * Input for the QueryEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 * and a UntitledEditorInput for the SQL File Editor.
 */
export class QueryInput extends EditorInput {

	public static ID: string = 'workbench.editorinputs.queryEditorInput';

	constructor(private name: string, private description: string, private _sql: UntitledEditorInput, private _results: QueryResultsInput) {
		super();
	}

	get sql(): UntitledEditorInput {
		return this._sql;
	}

	get results(): QueryResultsInput {
		return this._results;
	}

	public resolve(refresh?: boolean): TPromise<EditorModel> {
		return TPromise.as(null);
	}

	getTypeId(): string {
		return QueryInput.ID;
	}

	public getName(): string {
		return this.name;
	}

	public getDescription(): string {
		return this.description;
	}

	public supportsSplitEditor(): boolean {
		return false;
	}

	public matches(otherInput: any): boolean {
		if (!otherInput || !(otherInput instanceof QueryInput)) {
			return false;
		}
		else if (super.matches(otherInput)) {
			return true;
		}

		const otherQueryInput: QueryInput = <QueryInput>otherInput;
		return this.results.matches(otherQueryInput.results) && this.sql.matches(otherQueryInput.sql);
	}
}