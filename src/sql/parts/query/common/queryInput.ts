/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel, ConfirmResult, EncodingMode, IEncodingSupport } from 'vs/workbench/common/editor';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import Event from 'vs/base/common/event';
import URI from 'vs/base/common/uri';

/**
 * Input for the QueryEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 * and a UntitledEditorInput for the SQL File Editor.
 */
export class QueryInput extends EditorInput implements IEncodingSupport{

	public static ID: string = 'workbench.editorinputs.queryInput';
	public static SCHEMA: string = 'sql';

	constructor(private name: string, private description: string, private _sql: UntitledEditorInput, private _results: QueryResultsInput,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService) {
		super();
		// re-emit sql editor events through this editor
		this._sql.onDidChangeDirty(() => this._onDidChangeDirty.fire());
	}

	get sql(): UntitledEditorInput {
		return this._sql;
	}

	get results(): QueryResultsInput {
		return this._results;
	}

	public getTypeId(): string {
		return UntitledEditorInput.ID;
	}

	public getDescription(): string {
		return this.description;
	}

	public supportsSplitEditor(): boolean {
		return false;
	}

	public matches(otherInput: any): boolean {
		if (otherInput instanceof QueryInput) {
			return this._sql.matches(otherInput.sql);
		}

		return this._sql.matches(otherInput);
	}

	public getQueryResultsInputResource(): string {
		return this._results.uri;
	}

	// Forwarding resource functions to the inline sql file editor
	public get onDidModelChangeContent(): Event<void> {
		return this._sql.onDidModelChangeContent;
	}

	public get onDidModelChangeEncoding(): Event<void> {
		return this._sql.onDidModelChangeEncoding;
	}

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

	public getEncoding(): string {
		return this._sql.getEncoding();
	}

	public suggestFileName(): string {
		return this._sql.suggestFileName();
	}

	public setEncoding(encoding: string, mode: EncodingMode /* ignored, we only have Encode */): void {
		this._sql.setEncoding(encoding, mode);
	}

	public getName(): string {
		return this._sql.getName();
	}

	public hasAssociatedFilePath(): boolean {
		return this._sql.hasAssociatedFilePath;
	}

	public dispose(): void {
		this._sql.dispose();
		this._results.dispose();
		super.dispose();
	}

	public close(): void {
		let force = true;
		this.connectionManagementService.disconnectEditor(this.getQueryResultsInputResource(), force);
		this._sql.close();
		this._results.close();
		super.close();
	}
}