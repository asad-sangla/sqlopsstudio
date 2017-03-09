/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';
import * as strings from 'vs/base/common/strings';
import * as DOM from 'vs/base/browser/dom';
import { Builder, Dimension } from 'vs/base/browser/builder';

import { Registry } from 'vs/platform/platform';
import { IEditorRegistry, Extensions as EditorExtensions, EditorInput, EditorOptions } from 'vs/workbench/common/editor';
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
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
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

/**
 * Editor that hosts 2 sub-editors: A TextResourceEditor for SQL file editing, and a QueryResultsEditor
 * for viewing and editing query results. This editor is based off SideBySideEditor.
 */
export class QueryEditor extends BaseEditor implements IShowQueryResultsEditor {

	// The height of the tabs above the editor
	private readonly tabHeight: number = 35;

	// The height of the toolbar above the editor
	private readonly toolbarHeight: number = 35;

	public static ID: string = 'workbench.editor.queryEditor';

	private sash: IFlexibleSash;
	private editorTopOffset: number;
	private orientation: Orientation;
	private dimension: Dimension;

	private resultsEditor: QueryResultsEditor;
	private resultsEditorContainer: HTMLElement;

	private sqlEditor: TextResourceEditor;
	private sqlEditorContainer: HTMLElement;

	private toolbar: QueryTaskbar;
	private toolbarContainer: HTMLElement;
	private listDatabasesActionItem: ListDatabasesActionItem;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IEditorGroupService private editorGroupService: IEditorGroupService,
		@IContextMenuService protected contextMenuService: IContextMenuService,
		@IQueryModelService protected queryModelService: IQueryModelService,
		editorOrientation?: Orientation
	) {
		super(QueryEditor.ID, telemetryService);

		if (editorOrientation) {
			this.orientation = editorOrientation;
		} else {
			this.orientation = Orientation.HORIZONTAL;
		}

		if (this.orientation === Orientation.HORIZONTAL) {
			this.editorTopOffset = this.tabHeight + this.toolbarHeight;
		} else {
			this.editorTopOffset = this.toolbarHeight;
		}
	}

	// PUBLIC METHODS ////////////////////////////////////////////////////////////

	/**
	 * Called to create the editor in the parent builder.
	 */
	public createEditor(parent: Builder): void {
		const parentElement = parent.getHTMLElement();
		DOM.addClass(parentElement, 'side-by-side-editor');
		this._createToolbar(parentElement);
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
		if (this.resultsEditor) {
			this.resultsEditor.setVisible(visible, position);
		}
		if (this.sqlEditor) {
			this.sqlEditor.setVisible(visible, position);
		}
		super.setEditorVisible(visible, position);
	}

	/**
	 * Changes the position of the editor.
	 */
	public changePosition(position: Position): void {
		if (this.resultsEditor) {
			this.resultsEditor.changePosition(position);
		}
		if (this.sqlEditor) {
			this.sqlEditor.changePosition(position);
		}
		super.changePosition(position);
	}

	/**
	 * Called to indicate to the editor that the input should be cleared and resources associated with the
	 * input should be freed.
	 */
	public clearInput(): void {
		if (this.resultsEditor) {
			this.resultsEditor.clearInput();
		}
		if (this.sqlEditor) {
			this.sqlEditor.clearInput();
		}
		this._disposeEditors();
		super.clearInput();
	}

	/**
	 * Sets focus on this editor. Specifically, it sets the focus on the hosted text editor.
	 */
	public focus(): void {
		if (this.sqlEditor) {
			this.sqlEditor.focus();
		}
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
		this.dimension = dimension;

		if (this.sash) {
			this.sash.setDimenesion(this.dimension);
		}
	}

	/**
	 * Returns the editor control for the text editor.
	 */
	public getControl(): IEditorControl {
		if (this.sqlEditor) {
			return this.sqlEditor.getControl();
		}
		return null;
	}

	public getQueryResultsEditor(): QueryResultsEditor {
		return this.resultsEditor;
	}

	public getSqlEditor(): TextResourceEditor {
		return this.sqlEditor;
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

		this._createEditor(<QueryResultsInput>input.results, this.resultsEditorContainer)
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
	private _createToolbar(parentElement: HTMLElement): void {
		// Create QueryTaskbar
		this.toolbarContainer = DOM.append(parentElement, DOM.$('.queryTaskbar'));
		this.toolbar = new QueryTaskbar(this.toolbarContainer, this.contextMenuService, {
			actionItemProvider: (action: Action) => this._getListDatabasesActionItem(action),
		});

		// Create Actions for the toolbar
		let runQueryAction = new RunQueryAction(this.editorService, this.queryModelService);
		let cancelQueryAction = new CancelQueryAction(this.editorService, this.queryModelService);
		let connectDatabaseAction = new ConnectDatabaseAction();
		let disconnectDatabaseAction = new DisconnectDatabaseAction();
		let changeConnectionAction = new ChangeConnectionAction();
		let listDatabasesAction = new ListDatabasesAction();

		// Create HTML Elements for the toolbar
		let separator = QueryTaskbar.createTaskbarSeparator();

		// Register callbacks for the Actions
		this._register(this.queryModelService.onRunQueryStart(uri => {
			if (this.uri === uri) {
				cancelQueryAction.enabled = true;
				runQueryAction.enabled = false;
			}
		}));
		this._register(this.queryModelService.onRunQueryComplete(uri => {
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
		this.toolbar.setContent(content);
	}

	/**
	 * Gets the IActionItem for the List Databases dropdown if provided the associated Action.
	 * Otherwise returns null.
	 */
	private _getListDatabasesActionItem(action: Action): IActionItem {
		if (action.id === ListDatabasesAction.ID) {
			if (!this.listDatabasesActionItem) {
				this.listDatabasesActionItem = this.instantiationService.createInstance(ListDatabasesActionItem, null, action);
			}
			return this.listDatabasesActionItem;
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
			this.sqlEditor.setInput(newInput.sql, options);

			if (this._isResultsEditorVisible()) {
				this.resultsEditor.setInput(newInput.results, options);
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
				this._createEditor(<QueryResultsInput>newInput.results, this.resultsEditorContainer),
				this._createEditor(<UntitledEditorInput>newInput.sql, this.sqlEditorContainer)
			]).then(result => {
				this._onResultsEditorCreated(<QueryResultsEditor>result[0], newInput.results, options);
				this._onSqlEditorCreated(<TextResourceEditor>result[1], newInput.sql, options);
				this._doLayout();
			});

			// If only the sql editor exists, create a promise and wait for the sql editor to be created
		} else {
			this._createEditor(<UntitledEditorInput>newInput.sql, this.sqlEditorContainer)
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
		const descriptor = Registry.as<IEditorRegistry>(EditorExtensions.Editors).getEditor(editorInput);
		if (!descriptor) {
			return TPromise.wrapError(new Error(strings.format('Can not find a registered editor for the input {0}', editorInput)));
		}
		return this.instantiationService.createInstance(<EditorDescriptor>descriptor)
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
		this.sqlEditor = sqlEditor;
		return this.sqlEditor.setInput(sqlInput, options);
	}

	/**
	 * Sets input for the results editor after it has been created.
	 */
	private _onResultsEditorCreated(resultsEditor: QueryResultsEditor, resultsInput: QueryResultsInput, options: EditorOptions): TPromise<void> {
		this.resultsEditor = resultsEditor;
		return this.resultsEditor.setInput(resultsInput, options);
	}

	/**
	 * Appends the HTML for the SQL editor. Creates new HTML every time.
	 */
	private _createSqlEditorContainer() {
		const parentElement = this.getContainer().getHTMLElement();
		this.sqlEditorContainer = DOM.append(parentElement, DOM.$('.details-editor-container'));
		this.sqlEditorContainer.style.position = 'absolute';
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
			if (this.orientation === Orientation.HORIZONTAL) {
				cssClass = '.master-editor-container-horizontal';
			}

			this.resultsEditorContainer = DOM.append(parentElement, DOM.$(cssClass));
			this.resultsEditorContainer.style.position = 'absolute';

			input.results.container = this.resultsEditorContainer;
		} else {
			this.resultsEditorContainer = DOM.append(parentElement, input.results.container);
		}
	}

	/**
	 * Creates the sash with the requested orientation and registers sash callbacks
	 */
	private _createSash(parentElement: HTMLElement): void {
		if (this.orientation === Orientation.HORIZONTAL) {
			this.sash = this._register(new HorizontalFlexibleSash(parentElement, 220));
		} else {
			this.sash = this._register(new VerticalFlexibleSash(parentElement, 220));
		}

		if (this.dimension) {
			this.sash.setDimenesion(this.dimension);
		}
		this._register(this.sash.onPositionChange(position => this._doLayout()));
	}

	/**
	 * Updates the size of the 2 sub-editors. Uses agnostic dimensions due to the fact that
	 * the IFlexibleSash could be horizontal or vertical. The same logic is used for horizontal
	 * and vertical sashes.
	 */
	private _doLayout(): void {
		if (!this._isResultsEditorVisible() && this.sqlEditor) {
			this.sqlEditor.layout(this.dimension);
			return;
		}
		if (!this.sqlEditor || !this.resultsEditor || !this.dimension || !this.sash) {
			return;
		}

		// Get info from sash. E.g. for a horizontal sash the majorDimension is height and the
		// major position is height, because the sash can be dragged up and down to adjust the
		// heights of each sub-editor
		let splitPoint: number = this.sash.getMajorPositionValue();
		let majorDim: string = this.sash.getMajorDimensionName();
		let minorDim: string = this.sash.getMinorDimensionName();
		let majorPos: string = this.sash.getMajorPositionName();

		const sqlEditorMajorDimension = this.dimension[majorDim] - splitPoint;
		const queryResultsEditorMajorDimension = this.dimension[majorDim] - sqlEditorMajorDimension - this.editorTopOffset;

		this.sqlEditorContainer.style[majorDim] = `${queryResultsEditorMajorDimension}px`;
		this.sqlEditorContainer.style[minorDim] = `${this.dimension[minorDim]}px`;
		this.sqlEditorContainer.style[majorPos] = `${this.editorTopOffset}px`;

		this.resultsEditorContainer.style[majorDim] = `${sqlEditorMajorDimension}px`;
		this.resultsEditorContainer.style[minorDim] = `${this.dimension[minorDim]}px`;
		this.resultsEditorContainer.style[majorPos] = `${splitPoint}px`;

		this.sqlEditor.layout(this.sash.createDimension(queryResultsEditorMajorDimension, this.dimension[minorDim]));
		this.resultsEditor.layout(this.sash.createDimension(sqlEditorMajorDimension, this.dimension[minorDim]));
	}

	private _disposeEditors(): void {
		const parentContainer = this.getContainer().getHTMLElement();
		if (this.sqlEditor) {
			this.sqlEditor.dispose();
			this.sqlEditor = null;
		}
		if (this.resultsEditor) {
			this.resultsEditor.dispose();
			this.resultsEditor = null;
		}
		if (this.sqlEditorContainer) {
			parentContainer.removeChild(this.sqlEditorContainer);
			this.sqlEditorContainer = null;
		}
		if (this.resultsEditorContainer) {
			parentContainer.removeChild(this.resultsEditorContainer);
			this.resultsEditorContainer = null;
		}
	}

	/**
	 * Returns true if the QueryResultsInput has denoted that the results editor
	 * should be visible.
	 */
	private _isResultsEditorVisible(): boolean {
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
}