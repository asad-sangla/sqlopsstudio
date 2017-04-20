/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, append, show, hide } from 'vs/base/browser/dom';
import { IDisposable, combinedDisposable } from 'vs/base/common/lifecycle';
import URI from 'vs/base/common/uri';
import { IEditorInput } from 'vs/platform/editor/common/editor';
import { IStatusbarItem } from 'vs/workbench/browser/parts/statusbar/statusbar';
import { IGroupEvent } from 'vs/workbench/common/editor';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import Constants = require('sql/parts/query/common/constants');

// Query execution status
enum QueryExecutionStatus{
	Executing,
	Completed
}

// Shows query status in the editor
export class QueryStatusbarItem implements IStatusbarItem {

	private _element: HTMLElement;
	private _queryElement: HTMLElement;
	private _queryStatusEditors: { [editorUri: string]: QueryExecutionStatus };
	private _toDispose: IDisposable[];

	constructor(
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IEditorGroupService private _editorGroupService: IEditorGroupService,
	) {
		this._queryStatusEditors = {};
	}

	public render(container: HTMLElement): IDisposable {
		this._element = append(container, $('.query-statusbar-group'));
		this._queryElement = append(this._element, $('div.query-statusbar-item'));
		hide(this._queryElement);

		this._toDispose = [];
		this._toDispose.push(
			this._queryModelService.onRunQueryStart((uri:string) => this._onRunQueryStart(uri)),
			this._queryModelService.onRunQueryComplete((uri:string) => this._onRunQueryComplete(uri)),
			this._editorGroupService.onEditorsChanged(() => this._onEditorsChanged()),
			this._editorGroupService.getStacksModel().onEditorClosed(event => this._onEditorClosed(event))
		);

		return combinedDisposable(this._toDispose);
	}

	private _onEditorClosed(event: IGroupEvent): void{
		let uri = this._getEditorUri(event.editor);
		if (uri && uri in this._queryStatusEditors) {
			// If active editor is being closed, hide the query status.
			let activeEditor = this._editorService.getActiveEditor();
			if (activeEditor) {
				let currentUri = this._getEditorUri(activeEditor.input);
				if (uri === currentUri) {
					hide(this._queryElement);
				}
			}
			delete this._queryStatusEditors[uri];
		}
	}

	private _onEditorsChanged(): void{
		let activeEditor = this._editorService.getActiveEditor();
		if (activeEditor) {
			let uri = this._getEditorUri(activeEditor.input);

			// Show active editor's query status
			if (uri && uri in this._queryStatusEditors){
				this._showStatus(uri);
			} else {
				hide(this._queryElement);
			}
		} else {
			hide(this._queryElement);
		}
	}

	private _onRunQueryStart(uri: string): void {
		this._updateStatus(uri, QueryExecutionStatus.Executing);
	}

	private _onRunQueryComplete(uri: string): void {
		this._updateStatus(uri, QueryExecutionStatus.Completed);
	}

	private _getEditorUri(input: IEditorInput): string{
		let uri: URI;
		if (input instanceof QueryInput) {
			let queryCast: QueryInput = <QueryInput> input;
			if (queryCast) {
				uri = queryCast.getResource();
			}
		}

		if (uri){
			return uri.toString();
		}else{
			return undefined;
		}
	}

	// Update query status for the editor
	private _updateStatus(uri: string, newStatus: QueryExecutionStatus){
		if (uri) {
			this._queryStatusEditors[uri] = newStatus;
			this._showStatus(uri);
		}
	}

	// Show/hide query status for active editor
	private _showStatus(uri: string): void{
		let activeEditor = this._editorService.getActiveEditor();
		if (activeEditor) {
			let currentUri = this._getEditorUri(activeEditor.input);
			if (uri === currentUri) {
				switch(this._queryStatusEditors[uri]){
					case QueryExecutionStatus.Executing:
						this._queryElement.textContent = Constants.msgStatusRunQueryInProgress;
						show(this._queryElement);
						break;
					default:
						hide(this._queryElement);
				}
			}
		}
	}
}
