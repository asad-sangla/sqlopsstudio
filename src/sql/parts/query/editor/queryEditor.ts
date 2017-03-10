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
import { VerticalFlexibleSash, HorizontalFlexibleSash, IFlexibleSash } from '../views/flexibleSash';
import { Orientation } from 'vs/base/browser/ui/sash/sash';

import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { QueryResultsEditor } from 'sql/parts/query/editor/queryResultsEditor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { TextResourceEditor } from 'vs/workbench/browser/parts/editor/textResourceEditor';

import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { QueryTaskbar, ITaskbarContent } from 'sql/parts/query/editor/queryTaskbar';
import {
	RunQueryAction, CancelQueryAction, ListDatabasesAction, ListDatabasesActionItem,
	DisconnectDatabaseAction, ConnectDatabaseAction, ChangeConnectionAction
} from 'sql/parts/query/execution/queryActions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IActionItem } from 'vs/base/browser/ui/actionbar/actionbar';
import { IShowQueryResultsEditor } from 'sql/parts/query/editor/showQueryResultsEditor';
import { Action } from 'vs/base/common/actions';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IEditorDescriptorService } from 'sql/parts/query/editor/editorDescriptorService';

/**
 * Editor that hosts 2 sub-editors: A TextResourceEditor for SQL file editing, and a QueryResultsEditor
 * for viewing and editing query results. This editor is based off SideBySideEditor.
 */
export class QueryEditor extends BaseEditor implements IShowQueryResultsEditor {

	public static ID: string = 'workbench.editor.queryEditor';

	// The height of the tabs above the editor
	private readonly _tabHeight: number = 35;

	// The height of the taskbar above the editor
	private readonly _taskbarHeight: number = 35;

	private _sash: IFlexibleSash;
	private _editorTopOffset: number;
	private _orientation: Orientation;
	private _dimension: Dimension;

	private _resultsEditor: QueryResultsEditor;
	private _resultsEditorContainer: HTMLElement;

	private _sqlEditor: TextResourceEditor;
	private _sqlEditorContainer: HTMLElement;

	private _taskbar: QueryTaskbar;
	private _taskbarContainer: HTMLElement;
	private _listDatabasesActionItem: ListDatabasesActionItem;

	constructor(
		@ITelemetryService _telemetryService: ITelemetryService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IContextMenuService private _contextMenuService: IContextMenuService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IEditorDescriptorService private _editorDescriptorService: IEditorDescriptorService,
		editorOrientation?: Orientation
	) {
		super(QueryEditor.ID, _telemetryService);

		if (editorOrientation) {
			this._orientation = editorOrientation;
		} else {
			this._orientation = Orientation.HORIZONTAL;
		}

		if (this._orientation === Orientation.HORIZONTAL) {
			this._editorTopOffset = this._tabHeight + this._taskbarHeight;
		} else {
			this._editorTopOffset = this._taskbarHeight;
		}
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
	public setInput(newInput: QueryInput, options?: EditorOptions): TPromise<void> {
		const oldInput = <QueryInput>this.input;
		return super.setInput(newInput, options)
			.then(() => this._updateInput(oldInput, newInput, options));
	}

	/**
	 * Sets this editor and the 2 sub-editors to visible.
	 */
	public setEditorVisible(visible: boolean, position: Position): void {
		if (this._resultsEditor) {
			this._resultsEditor.setVisible(visible, position);
		}
		if (this._sqlEditor) {
			this._sqlEditor.setVisible(visible, position);
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
		if (this._sqlEditor) {
			this._sqlEditor.changePosition(position);
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
		if (this._sqlEditor) {
			this._sqlEditor.clearInput();
		}
		this._disposeEditors();
		super.clearInput();
	}

	/**
	 * Sets focus on this editor. Specifically, it sets the focus on the hosted text editor.
	 */
	public focus(): void {
		if (this._sqlEditor) {
			this._sqlEditor.focus();
		}
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
		this._dimension = dimension;

		if (this._sash) {
			this._sash.setDimenesion(this._dimension);
		}
	}

	/**
	 * Returns the editor control for the text editor.
	 */
	public getControl(): IEditorControl {
		if (this._sqlEditor) {
			return this._sqlEditor.getControl();
		}
		return null;
	}

	public getQueryResultsEditor(): QueryResultsEditor {
		return this._resultsEditor;
	}

	public getSqlEditor(): TextResourceEditor {
		return this._sqlEditor;
	}

	public dispose(): void {
		this._disposeEditors();
		super.dispose();
	}

	/**
	 * Makes visible the QueryResultsEditor for the current QueryInput (if it is not
	 * already visible).
	 */
	public showQueryResultsEditor(): void {
		if (this._isResultsEditorVisible()) {
			return;
		}

		this._createSash(this.getContainer().getHTMLElement());
		this._createResultsEditorContainer();

		let input = <QueryInput>this.input;
		this._createEditor(<QueryResultsInput>input.results, this._resultsEditorContainer)
			.then(result => {
				this._onResultsEditorCreated(<QueryResultsEditor>result, input.results, this.options);
				this._setResultsEditorVisible();
				this._doLayout();
			});
	}

	get uri(): string {
		let input: QueryInput = <QueryInput>this.input;
		return input ? input.getQueryResultsInputResource() : undefined;
	}

	// PRIVATE METHODS ////////////////////////////////////////////////////////////

	/**
	 * Creates the query execution taskbar that appears at the top of the QueryEditor
	 */
	private _createTaskbar(parentElement: HTMLElement): void {
		// Create QueryTaskbar
		this._taskbarContainer = DOM.append(parentElement, DOM.$('.queryTaskbar'));
		this._taskbar = new QueryTaskbar(this._taskbarContainer, this._contextMenuService, {
			actionItemProvider: (action: Action) => this._getListDatabasesActionItem(action),
		});

		// Create Actions for the taskbar
		let runQueryAction = new RunQueryAction(this._editorService, this._queryModelService);
		let cancelQueryAction = new CancelQueryAction(this._editorService, this._queryModelService);
		let connectDatabaseAction = new ConnectDatabaseAction();
		let disconnectDatabaseAction = new DisconnectDatabaseAction();
		let changeConnectionAction = new ChangeConnectionAction();
		let listDatabasesAction = new ListDatabasesAction();

		// Create HTML Elements for the taskbar
		let separator = QueryTaskbar.createTaskbarSeparator();

		// Register callbacks for the Actions
		this._register(this._queryModelService.onRunQueryStart(uri => {
			if (this.uri === uri) {
				cancelQueryAction.enabled = true;
				runQueryAction.enabled = false;
			}
		}));
		this._register(this._queryModelService.onRunQueryComplete(uri => {
			if (this.uri === uri) {
				cancelQueryAction.enabled = false;
				runQueryAction.enabled = true;
			}
		}));

		// Set the content in the order we desire
		let content: ITaskbarContent[] = [
			{ action: runQueryAction },
			{ action: cancelQueryAction },
			{ element: separator },
			{ action: connectDatabaseAction },
			{ action: disconnectDatabaseAction },
			{ action: changeConnectionAction },
			{ action: listDatabasesAction },
		];
		this._taskbar.setContent(content);
	}

	/**
	 * Gets the IActionItem for the List Databases dropdown if provided the associated Action.
	 * Otherwise returns null.
	 */
	private _getListDatabasesActionItem(action: Action): IActionItem {
		if (action.id === ListDatabasesAction.ID) {
			if (!this._listDatabasesActionItem) {
				this._listDatabasesActionItem = this._instantiationService.createInstance(ListDatabasesActionItem, null, action);
			}
			return this._listDatabasesActionItem;
		}

		return null;
	}

	/**
	 * Handles setting input for this editor. If this new input does not match the old input (e.g. a new file
	 * has been opened with the same editor, or we are opening the editor for the first time).
	 */
	private _updateInput(oldInput: QueryInput, newInput: QueryInput, options?: EditorOptions): TPromise<void> {
		let returnValue: TPromise<void>;

		if (!newInput.matches(oldInput)) {
			if (oldInput) {
				this._disposeEditors();
			}

			this._createSqlEditorContainer();
			if (this._isResultsEditorVisible()) {
				this._createResultsEditorContainer();
			}

			returnValue = this._setNewInput(newInput, options);
		} else {
			this._sqlEditor.setInput(newInput.sql, options);

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
	 * - Opened with a new QueryInput
	 * This will create only the SQL editor if the results editor does not yet exist for the
	 * given QueryInput.
	 */
	private _setNewInput(newInput: QueryInput, options?: EditorOptions): TPromise<void> {
		// If both editors exist, create a joined promise and wait for both editors to be created
		if (this._isResultsEditorVisible()) {
			return TPromise.join([
				this._createEditor(<QueryResultsInput>newInput.results, this._resultsEditorContainer),
				this._createEditor(<UntitledEditorInput>newInput.sql, this._sqlEditorContainer)
			]).then(result => {
				this._onResultsEditorCreated(<QueryResultsEditor>result[0], newInput.results, options);
				this._onSqlEditorCreated(<TextResourceEditor>result[1], newInput.sql, options);
				this._doLayout();
			});

			// If only the sql editor exists, create a promise and wait for the sql editor to be created
		} else {
			this._createEditor(<UntitledEditorInput>newInput.sql, this._sqlEditorContainer)
				.then(result => {
					this._onSqlEditorCreated(<TextResourceEditor>result, newInput.sql, options);
					this._doLayout();
				});
		}
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
	 * Sets input for the SQL editor after it has been created.
	 */
	private _onSqlEditorCreated(sqlEditor: TextResourceEditor, sqlInput: UntitledEditorInput, options: EditorOptions): TPromise<void> {
		this._sqlEditor = sqlEditor;
		return this._sqlEditor.setInput(sqlInput, options);
	}

	/**
	 * Sets input for the results editor after it has been created.
	 */
	private _onResultsEditorCreated(resultsEditor: QueryResultsEditor, resultsInput: QueryResultsInput, options: EditorOptions): TPromise<void> {
		this._resultsEditor = resultsEditor;
		return this._resultsEditor.setInput(resultsInput, options);
	}

	/**
	 * Appends the HTML for the SQL editor. Creates new HTML every time.
	 */
	private _createSqlEditorContainer() {
		const parentElement = this.getContainer().getHTMLElement();
		this._sqlEditorContainer = DOM.append(parentElement, DOM.$('.details-editor-container'));
		this._sqlEditorContainer.style.position = 'absolute';
	}

	/**
	 * Appends the HTML for the QueryResultsEditor to the QueryEditor. If the HTML has not yet been
	 * created, it creates it and appends it. If it has already been created, it locates it and
	 * appends it.
	 */
	private _createResultsEditorContainer() {
		const parentElement = this.getContainer().getHTMLElement();
		let input = <QueryInput>this.input;

		if (!input.results.container) {
			let cssClass: string = '.master-editor-container';
			if (this._orientation === Orientation.HORIZONTAL) {
				cssClass = '.master-editor-container-horizontal';
			}

			this._resultsEditorContainer = DOM.append(parentElement, DOM.$(cssClass));
			this._resultsEditorContainer.style.position = 'absolute';

			input.results.container = this._resultsEditorContainer;
		} else {
			this._resultsEditorContainer = DOM.append(parentElement, input.results.container);
		}
	}

	/**
	 * Creates the sash with the requested orientation and registers sash callbacks
	 */
	private _createSash(parentElement: HTMLElement): void {
		if (this._orientation === Orientation.HORIZONTAL) {
			this._sash = this._register(new HorizontalFlexibleSash(parentElement, 220));
		} else {
			this._sash = this._register(new VerticalFlexibleSash(parentElement, 220));
		}

		if (this._dimension) {
			this._sash.setDimenesion(this._dimension);
		}
		this._register(this._sash.onPositionChange(position => this._doLayout()));
	}

	/**
	 * Updates the size of the 2 sub-editors. Uses agnostic dimensions due to the fact that
	 * the IFlexibleSash could be horizontal or vertical. The same logic is used for horizontal
	 * and vertical sashes.
	 */
	private _doLayout(): void {
		if (!this._isResultsEditorVisible() && this._sqlEditor) {
			this._sqlEditor.layout(this._dimension);
			return;
		}
		if (!this._sqlEditor || !this._resultsEditor || !this._dimension || !this._sash) {
			return;
		}

		// Get info from sash. E.g. for a horizontal sash the majorDimension is height and the
		// major position is height, because the sash can be dragged up and down to adjust the
		// heights of each sub-editor
		let splitPoint: number = this._sash.getMajorPositionValue();
		let majorDim: string = this._sash.getMajorDimensionName();
		let minorDim: string = this._sash.getMinorDimensionName();
		let majorPos: string = this._sash.getMajorPositionName();

		const sqlEditorMajorDimension = this._dimension[majorDim] - splitPoint;
		const queryResultsEditorMajorDimension = this._dimension[majorDim] - sqlEditorMajorDimension - this._editorTopOffset;

		this._sqlEditorContainer.style[majorDim] = `${queryResultsEditorMajorDimension}px`;
		this._sqlEditorContainer.style[minorDim] = `${this._dimension[minorDim]}px`;
		this._sqlEditorContainer.style[majorPos] = `${this._editorTopOffset}px`;

		this._resultsEditorContainer.style[majorDim] = `${sqlEditorMajorDimension}px`;
		this._resultsEditorContainer.style[minorDim] = `${this._dimension[minorDim]}px`;
		this._resultsEditorContainer.style[majorPos] = `${splitPoint}px`;

		this._sqlEditor.layout(this._sash.createDimension(queryResultsEditorMajorDimension, this._dimension[minorDim]));
		this._resultsEditor.layout(this._sash.createDimension(sqlEditorMajorDimension, this._dimension[minorDim]));
	}

	private _disposeEditors(): void {
		const parentContainer = this.getContainer().getHTMLElement();
		if (this._sqlEditor) {
			this._sqlEditor.dispose();
			this._sqlEditor = null;
		}
		if (this._resultsEditor) {
			this._resultsEditor.dispose();
			this._resultsEditor = null;
		}
		if (this._sqlEditorContainer) {
			parentContainer.removeChild(this._sqlEditorContainer);
			this._sqlEditorContainer = null;
		}
		if (this._resultsEditorContainer) {
			parentContainer.removeChild(this._resultsEditorContainer);
			this._resultsEditorContainer = null;
		}
	}

	/**
	 * Returns true if the QueryResultsInput has denoted that the results editor
	 * should be visible.
	 * Public for testing only.
	 */
	public _isResultsEditorVisible(): boolean {
		let input: QueryInput = <QueryInput>this.input;

		if (!input) {
			return false;
		}
		return input.results.visible;
	}

	private _setResultsEditorVisible(): void {
		let input: QueryInput = <QueryInput>this.input;
		input.results.setVisibleTrue();
	}

	// TESTING PROPERTIES ////////////////////////////////////////////////////////////

	public get resultsEditor(): QueryResultsEditor {
		return this._resultsEditor;
	}

	public get sqlEditor(): TextResourceEditor {
		return this._sqlEditor;
	}

	public get taskbar(): QueryTaskbar {
		return this._taskbar;
	}

	public get sash(): IFlexibleSash {
		return this._sash;
	}

	public get resultsEditorContainer(): HTMLElement {
		return this._resultsEditorContainer;
	}

	public get sqlEditorContainer(): HTMLElement {
		return this._sqlEditorContainer;
	}

	public get taskbarContainer(): HTMLElement {
		return this._taskbarContainer;
	}
}
