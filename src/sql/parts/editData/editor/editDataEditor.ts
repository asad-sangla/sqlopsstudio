/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';
import * as strings from 'vs/base/common/strings';
import * as DOM from 'vs/base/browser/dom';
import { Builder, Dimension } from 'vs/base/browser/builder';

import { EditorInput, EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor, EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorControl, Position } from 'vs/platform/editor/common/editor';

import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryResultsEditor } from 'sql/parts/query/editor/queryResultsEditor';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';

import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { QueryTaskbar, ITaskbarContent } from 'sql/parts/query/editor/queryTaskbar';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IActionItem } from 'vs/base/browser/ui/actionbar/actionbar';
import { Action } from 'vs/base/common/actions';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IEditorDescriptorService } from 'sql/parts/query/editor/editorDescriptorService';
import { IShowQueryResultsEditor } from 'sql/parts/query/common/showQueryResultsEditor';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import {
	RefreshTableAction, StopRefreshTableAction,
	ChangeMaxRowsAction, ChangeMaxRowsActionItem} from 'sql/parts/editData/execution/editDataActions';

/**
 * Editor that hosts an action bar and a resultSetInput for an edit data session
 */
export class EditDataEditor extends BaseEditor implements IShowQueryResultsEditor {

	public static ID: string = 'workbench.editor.editDataEditor';

	// The height of the taskbar above the editor
	private readonly _taskbarHeight: number = 35;

	private _editorTopOffset: number;
	private _dimension: Dimension;

	private _resultsEditor: QueryResultsEditor;
	private _resultsEditorContainer: HTMLElement;

	private _taskbar: QueryTaskbar;
	private _taskbarContainer: HTMLElement;
	private _changeMaxRowsActionItem: ChangeMaxRowsActionItem;

	private _stopRefreshTableAction: StopRefreshTableAction;
	private _refreshTableAction: RefreshTableAction;
	private _changeMaxRowsAction: ChangeMaxRowsAction;

	constructor(
		@ITelemetryService _telemetryService: ITelemetryService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IContextMenuService private _contextMenuService: IContextMenuService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IEditorDescriptorService private _editorDescriptorService: IEditorDescriptorService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService
	) {
		super(EditDataEditor.ID, _telemetryService);
		this._editorTopOffset = this._taskbarHeight;

	}

	// PUBLIC METHODS ////////////////////////////////////////////////////////////

	/**
	 * Called to create the editor in the parent builder.
	 */
	public createEditor(parent: Builder): void {
		const parentElement = parent.getHTMLElement();
		DOM.addClass(parentElement, 'side-by-side-editor');
		this._createTaskbar(parentElement);
	}

	/**
	 * Sets the input data for this editor.
	 */
	public setInput(newInput: EditDataInput, options?: EditorOptions): TPromise<void> {
		const oldInput = <EditDataInput>this.input;
		return super.setInput(newInput, options)
			.then(() => this._updateInput(oldInput, newInput, options) );
	}

	/**
	 * Sets this editor and the sub-editors to visible.
	 */
	public setEditorVisible(visible: boolean, position: Position): void {
		if (this._resultsEditor) {
			this._resultsEditor.setVisible(visible, position);
		}
		super.setEditorVisible(visible, position);
	}

	/**
	 * Changes the position of the editor.
	 */
	public changePosition(position: Position): void {
		if (this._resultsEditor) {
			this._resultsEditor.changePosition(position);
		}
		super.changePosition(position);
	}

	/**
	 * Called to indicate to the editor that the input should be cleared and resources associated with the
	 * input should be freed.
	 */
	public clearInput(): void {
		if (this._resultsEditor) {
			this._resultsEditor.clearInput();
		}
		this._disposeEditors();
		super.clearInput();
	}

	/**
	 * Sets focus on the result editor
	 */
	public focus(): void {
		if (this._resultsEditor) {
			this._resultsEditor.focus();
		}
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
		this._dimension = dimension;
	}

	/**
	 * Returns the editor control for the result editor
	 */
	public getControl(): IEditorControl {
		if (this._resultsEditor) {
			return this._resultsEditor.getControl();
		}
		return null;
	}

	public getQueryResultsEditor(): QueryResultsEditor {
		return this._resultsEditor;
	}

	public dispose(): void {
		this._disposeEditors();
		super.dispose();
	}

	public close(): void {
		this._connectionManagementService.disconnectEditor(this, this.uri, true);
		let queryInput: EditDataInput = <EditDataInput>this.input;
		queryInput.results.close();
	}

	get uri(): string {
		let input: EditDataInput = <EditDataInput>this.input;
		return input ? input.getQueryResultsInputResource() : undefined;
	}

	// PRIVATE METHODS ////////////////////////////////////////////////////////////

	private _createTaskbar(parentElement: HTMLElement): void {
		// Create QueryTaskbar
		this._taskbarContainer = DOM.append(parentElement, DOM.$('.queryTaskbar'));
		this._taskbar = new QueryTaskbar(this._taskbarContainer, this._contextMenuService, {
			actionItemProvider: (action: Action) => this._getChangeMaxRowsAction(action)
		});

		// Create Actions for the toolbar
		this._stopRefreshTableAction = this._instantiationService.createInstance(StopRefreshTableAction, this);
		this._refreshTableAction = this._instantiationService.createInstance(RefreshTableAction, this);
		this._changeMaxRowsAction = this._instantiationService.createInstance(ChangeMaxRowsAction, this);

		// Create HTML Elements for the taskbar
		let separator = QueryTaskbar.createTaskbarSeparator();
		let textSeperator = QueryTaskbar.createTaskbarText('Max Rows:');

		// Set the content in the order we desire
		let content: ITaskbarContent[] = [
			{ action: this._stopRefreshTableAction },
			{ action: this._refreshTableAction },
			{ element: separator },
			{ element: textSeperator},
			{ action: this._changeMaxRowsAction }
		];
		this._taskbar.setContent(content);
	}

	/**
	 * Gets the IActionItem for the list of row number drop down
	 */
	private _getChangeMaxRowsAction(action: Action): IActionItem {
		let actionID = ChangeMaxRowsAction.ID;
		if (action.id === actionID) {
			if (!this._changeMaxRowsActionItem) {
				this._changeMaxRowsActionItem = this._instantiationService.createInstance(ChangeMaxRowsActionItem, null, action);
			}
			return this._changeMaxRowsActionItem;
		}

		return null;
	}

	/**
	 * Handles setting input for this editor. If this new input does not match the old input (e.g. a new file
	 * has been opened with the same editor, or we are opening the editor for the first time).
	 */
	private _updateInput(oldInput: EditDataInput, newInput: EditDataInput, options?: EditorOptions): TPromise<void> {
		let returnValue: TPromise<void>;

		if (!newInput.matches(oldInput)) {
			if (oldInput) {
				this._disposeEditors();
			}

			if (this._isResultsEditorVisible()) {
				this._createResultsEditorContainer();
				let uri: string = newInput.getQueryResultsInputResource();
				if (uri) {
					this._queryModelService.refreshResultsets(uri);
				}
			}

			returnValue = this._setNewInput(newInput, options);
		} else {
			if (this._isResultsEditorVisible()) {
				this._resultsEditor.setInput(newInput.results, options);
			}
			returnValue = TPromise.as(null);
		}

		return returnValue;
	}

	/**
	 * Handles setting input and creating editors when this QueryEditor is either:
	 * - Opened for the first time
	 * - Opened with a new EditDataInput
	 */
	private _setNewInput(newInput: EditDataInput, options?: EditorOptions): TPromise<void> {
		if (this._isResultsEditorVisible()) {
			// If both editors exist, create a joined promise and wait for both editors to be created
			return TPromise.join([this._createEditor(<QueryResultsInput>newInput.results, this._resultsEditorContainer)]).then(result => {
				this._onResultsEditorCreated(<QueryResultsEditor>result[0], newInput.results, options);
			});
		}

		return TPromise.as(undefined);
	}

	/**
	 * Create a single editor based on the type of the given EditorInput.
	 */
	private _createEditor(editorInput: EditorInput, container: HTMLElement): TPromise<BaseEditor> {
		const descriptor = this._editorDescriptorService.getEditor(editorInput);
		if (!descriptor) {
			return TPromise.wrapError(new Error(strings.format('Can not find a registered editor for the input {0}', editorInput)));
		}
		return this._instantiationService.createInstance(<EditorDescriptor>descriptor)
			.then((editor: BaseEditor) => {
				editor.create(new Builder(container));
				editor.setVisible(this.isVisible(), this.position);
				return editor;
			});
	}

	/**
	 * Sets input for the results editor after it has been created.
	 */
	private _onResultsEditorCreated(resultsEditor: QueryResultsEditor, resultsInput: QueryResultsInput, options: EditorOptions): TPromise<void> {
		this._resultsEditor = resultsEditor;
		// Conditionally render the results pane
		return this._resultsEditor.setInput(resultsInput, options);
	}

	/**
	 * Appends the HTML for the QueryResultsEditor to the QueryEditor. If the HTML has not yet been
	 * created, it creates it and appends it. If it has already been created, it locates it and
	 * appends it.
	 */
	private _createResultsEditorContainer() {
		const parentElement = this.getContainer().getHTMLElement();
		let input = <EditDataInput>this.input;

		if (!input.results.container) {
			this._resultsEditorContainer = DOM.append(parentElement, DOM.$('.editDataEditor'));
			input.results.container = this._resultsEditorContainer;
		} else {
			this._resultsEditorContainer = DOM.append(parentElement, input.results.container);
		}
	}

	private _disposeEditors(): void {
		if (this._resultsEditor) {
			this._resultsEditor.dispose();
			this._resultsEditor = null;
		}

		const parentContainer = this.getContainer().getHTMLElement();
		if (this._resultsEditorContainer) {
			this._resultsEditorContainer.remove();
			this._resultsEditorContainer = null;
		}
	}

	/**
	 * Returns true if the QueryResultsInput has denoted that the results editor
	 * should be visible.
	 * Public for testing only.
	 */
	public _isResultsEditorVisible(): boolean {
		let input: EditDataInput = <EditDataInput>this.input;

		if (!input) {
			return false;
		}
		return input.results.visible;
	}

	private _setResultsEditorVisible(): void {
		let input: EditDataInput = <EditDataInput>this.input;
		input.results.setVisibleTrue();
	}

	// Connection Lifecycle Functions

	/**
	 * Makes visible the QueryResultsEditor for the current QueryInput (if it is not
	 * already visible).
	 */
	public showQueryResultsEditor(): void {
		if (this._isResultsEditorVisible()) {
			return;
		}

		let input = <EditDataInput>this.input;
		this._createResultsEditorContainer();

		this._createEditor(<QueryResultsInput>input.results, this._resultsEditorContainer)
			.then(result => {
				this._onResultsEditorCreated(<QueryResultsEditor>result, input.results, this.options);
				this._setResultsEditorVisible();
			});
	}

	onConnectStart(): void {
		// TODO: Indicate connection started
	}

	onConnectReject(): void {
		// TODO: deal with connection failure
	}

	onConnectSuccess(runQueryOnCompletion: boolean): void {
		let input = <EditDataInput>this._input;
		this._queryModelService.initializeEdit(input.uri, input.tableName, 'TABLE');
		this.showQueryResultsEditor();
	}

	onDisconnect(): void {
		// TODO: deal with disconnections
	}
}
