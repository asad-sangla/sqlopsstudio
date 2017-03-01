/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel, ConfirmResult} from 'vs/workbench/common/editor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import URI from 'vs/base/common/uri';
import Event from 'vs/base/common/event';

/**
 * Input for the QueryEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 * and a UntitledEditorInput for the SQL File Editor.
 */
export class QueryInput extends EditorInput {

	public static ID: string = 'workbench.editorinputs.queryInput';

	constructor(private name: string, private description: string, private _sql: UntitledEditorInput, private _results: QueryResultsInput) {
		super();
	}

	get sql(): UntitledEditorInput {
		return this._sql;
	}

	get results(): QueryResultsInput {
		return this._results;
	}

	public getTypeId(): string {
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

	// Forwarding resource functions to the inline sql file editor
	public resolve(refresh?: boolean): TPromise<EditorModel> {
		return this._sql.resolve(refresh);
	}

	public save(): TPromise<boolean> {
		return this._sql.save();
	}

	public isDirty(): boolean {
		return this._sql.isDirty();
	}

	public confirmSave(): ConfirmResult {
		return this._sql.confirmSave();
	}

	public getResource(): URI {
		return this._sql.getResource();
	}

	public get hasAssociatedFilePath(): boolean {
		return this._sql.hasAssociatedFilePath;
	}

	public get onDidModelChangeContent(): Event<void> {
		return this._sql.onDidModelChangeContent;
	}

	public get onDidModelChangeEncoding(): Event<void> {
		return this._sql.onDidModelChangeEncoding;
	}
}