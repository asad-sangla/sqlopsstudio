/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!../editor/media/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';
import * as strings from 'vs/base/common/strings';
import * as DOM from 'vs/base/browser/dom';
import { Builder, Dimension } from 'vs/base/browser/builder';

import { Registry } from 'vs/platform/platform';
import { IEditorRegistry, Extensions as EditorExtensions, EditorInput, EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor, EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorControl, Position, IEditor } from 'vs/platform/editor/common/editor';
import { VerticalFlexibleSash, HorizontalFlexibleSash, IFlexibleSash } from '../views/flexibleSash';
import { Orientation} from 'vs/base/browser/ui/sash/sash';

import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { QueryResultsEditor } from './queryResultsEditor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { TextResourceEditor } from 'vs/workbench/browser/parts/editor/textResourceEditor';

/**
 * Editor that hosts 2 sub-editors: A TextResourceEditor for SQL file editing, and a QueryResultsEditor
 * for viewing and editing query results. This editor is based off SideBySideEditor.
 */
export class QueryEditor extends BaseEditor {

	// The height of the tabs above the editor
	private readonly tabHeight: number = 35;

	public static ID: string = 'workbench.editor.queryEditor';

	private sash: IFlexibleSash;
	private tabsOffset: number;
	private orientation: Orientation;
	private dimension: Dimension;

	private resultsEditor: QueryResultsEditor;
	private resultsEditorContainer: HTMLElement;

	private sqlEditor: TextResourceEditor;
	private sqlEditorContainer: HTMLElement;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService private instantiationService: IInstantiationService,
		 editorOrientation?: Orientation
	) {
		super(QueryEditor.ID, telemetryService);

		if (editorOrientation) {
			this.orientation = editorOrientation;
		} else {
			this.orientation = Orientation.HORIZONTAL;
		}

		if (this.orientation === Orientation.HORIZONTAL) {
			this.tabsOffset = this.tabHeight;
		} else {
			this.tabsOffset = 0;
		}
	}

	// PUBLIC METHODS ////////////////////////////////////////////////////////////

	/**
	 * Called to create the editor in the parent builder.
	 */
	public createEditor(parent: Builder): void {
		const parentElement = parent.getHTMLElement();
		DOM.addClass(parentElement, 'side-by-side-editor');
		this._createSash(parentElement);
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
	 * Sets focus on this editor. Specifically, it sets the focus on the hosted QueryResultsEditor.
	 */
	public focus(): void {
		if (this.resultsEditor) {
			this.resultsEditor.focus();
		}
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
		this.dimension = dimension;
		this.sash.setDimenesion(this.dimension);
	}

	/**
	 * Returns the editor control for the QueryResultsEditor.
	 */
	public getControl(): IEditorControl {
		if (this.resultsEditor) {
			return this.resultsEditor.getControl();
		}
		return null;
	}

	public getQueryResultsEditor(): IEditor {
		return this.resultsEditor;
	}

	public getSqlEditor(): IEditor {
		return this.sqlEditor;
	}

	public dispose(): void {
		this._disposeEditors();
		super.dispose();
	}

	// PRIVATE METHODS ////////////////////////////////////////////////////////////

	private _updateInput(oldInput: QueryInput, newInput: QueryInput, options?: EditorOptions): TPromise<void> {
		if (!newInput.matches(oldInput)) {
			if (oldInput) {
				this._disposeEditors();
			}
			this._createEditorContainers();
			return this._setNewInput(newInput, options);
		} else {
			this.sqlEditor.setInput(newInput.sql, options);
			this.resultsEditor.setInput(newInput.results, options);
		}
	}

	private _setNewInput(newInput: QueryInput, options?: EditorOptions): TPromise<void> {
		return TPromise.join([
			this._createEditor(<QueryResultsInput>newInput.results, this.resultsEditorContainer),
			this._createEditor(<UntitledEditorInput>newInput.sql, this.sqlEditorContainer)
		]).then(result => this._onEditorsCreated(<QueryResultsEditor>result[0], <TextResourceEditor>result[1], newInput.results, newInput.sql, options));
	}

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
	 * Sets class variables and performs initial layout after. To be called after the both sub-editors are created.
	 */
	private _onEditorsCreated(resultsEditor: QueryResultsEditor, sqlEditor: TextResourceEditor, resultsInput: QueryResultsInput, sqlInput: UntitledEditorInput, options: EditorOptions): TPromise<void> {
		this.sqlEditor = sqlEditor;
		this.resultsEditor = resultsEditor;
		this._doLayout();
		return TPromise.join([this.sqlEditor.setInput(sqlInput, options), this.resultsEditor.setInput(resultsInput, options)]).then(() => this.focus());
	}

	private _createEditorContainers(): void {
		const parentElement = this.getContainer().getHTMLElement();
		this.sqlEditorContainer = DOM.append(parentElement, DOM.$('.details-editor-container'));
		this.sqlEditorContainer.style.position = 'absolute';

		let cssClass: string = '.master-editor-container';
		if(this.orientation === Orientation.HORIZONTAL) {
			cssClass = '.master-editor-container-horizontal';
		}

		this.resultsEditorContainer = DOM.append(parentElement, DOM.$(cssClass));
		this.resultsEditorContainer.style.position = 'absolute';
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

		this._register(this.sash.onPositionChange(position => this._doLayout()));
	}

	/**
	 * Updates the size of the 2 sub-editors. Uses agnostic dimensions due to the fact that
	 * the IFlexibleSash could be horizontal or vertical. The same logic is used for horizontal
	 * and vertical sashes.
	 */
	private _doLayout(): void {
		if (!this.sqlEditor || !this.resultsEditor || !this.dimension) {
			return;
		}

		// Get info from sash. E.g. for a horizontal sash the majorDimension is height and the
		// major position is height, because the sash can be dragged up and down to adjust the
		// heights of each sub-editor
		let	splitPoint: number = this.sash.getMajorPositionValue();
		let	majorDim: string = this.sash.getMajorDimensionName();
		let	minorDim: string = this.sash.getMinorDimensionName();
		let	majorPos: string = this.sash.getMajorPositionName();

		const sqlEditorMajorDimension = this.dimension[majorDim] - splitPoint;
		const queryResultsEditorMajorDimension = this.dimension[majorDim] - sqlEditorMajorDimension - this.tabsOffset;

		this.sqlEditorContainer.style[majorDim] = `${queryResultsEditorMajorDimension}px`;
		this.sqlEditorContainer.style[minorDim] = `${this.dimension[minorDim]}px`;
		this.sqlEditorContainer.style[majorPos] = `${this.tabsOffset}px`;

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
}