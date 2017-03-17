/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput,  EditorModel, ConfirmResult } from 'vs/workbench/common/editor';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import URI from 'vs/base/common/uri';

/**
 * Input for the EditDataEditor. This input is simply a wrapper around a QueryResultsInput for the QueryResultsEditor
 */
export class EditDataInput extends EditorInput {

	public static ID: string = 'workbench.editorinputs.editDataInput';

	constructor(private _uri: URI, private _description: string, private _tableName, private _results: QueryResultsInput,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService) {
		super();
	}

	get tableName(): string {
		return this._tableName;
	}

	get results(): QueryResultsInput {
		return this._results;
	}

	get uri(): string {
		return this._uri.toString();
	}

	public getTypeId(): string {
		return EditDataInput.ID;
	}

	public getDescription(): string {
		return this._description;
	}

	public supportsSplitEditor(): boolean {
		return false;
	}

	public matches(otherInput: any): boolean {
		if (otherInput instanceof EditDataInput) {
			return (this._uri === otherInput._uri);
		}

		return false;
	}

	public getQueryResultsInputResource(): string {
		return this._results.uri;
	}

	public getResource(): URI {
		return this._uri;
	}

	public getName(): string {
		return this._uri.path;
	}

	public resolve(refresh?: boolean): TPromise<EditorModel> {
		return TPromise.as(null);
	}

	public dispose(): void {
		this._results.dispose();
		super.dispose();
	}
}
