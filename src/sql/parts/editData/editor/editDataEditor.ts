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
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IQueryParameterService } from 'sql/parts/query/execution/queryParameterService';
import {
	RefreshTableAction, StopRefreshTableAction,
	ChangeMaxRowsAction, ChangeMaxRowsActionItem} from 'sql/parts/editData/execution/editDataActions';
import { append, $ } from 'vs/base/browser/dom';
import { AppModule } from 'sql/parts/grid/views/editdata.module';
import * as nls from 'vs/nls';

declare let AngularPlatformBrowserDynamic;

/**
 * Editor that hosts an action bar and a resultSetInput for an edit data session
 */
export class EditDataEditor extends BaseEditor {
	public static ID: string = 'workbench.editor.editDataEditor';
	private _dimension: Dimension;
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
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IQueryParameterService private _angularParameterService: IQueryParameterService
	) {
		super(EditDataEditor.ID, _telemetryService);
	}

	// PUBLIC METHODS ////////////////////////////////////////////////////////////

	// Getters and Setters
	public get editDataInput(): EditDataInput { return <EditDataInput>this.input; }
	public get uri(): string { return this.input ? this.editDataInput.uri.toString() : undefined; }
	public get tableName(): string { return this.editDataInput.tableName; }


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
		let oldInput = <EditDataInput>this.input;
		if (!newInput.setup) {
			this._register(newInput.updateTaskbar((owner) => this._updateTaskbar(owner)));
			this._register(newInput.showTableView(() => this._showTableView()));
			newInput.setupComplete();
		}

		return super.setInput(newInput, options)
			.then(() => this._updateInput(oldInput, newInput, options) );
	}

	/**
	 * Sets this editor and the sub-editors to visible.
	 */
	public setEditorVisible(visible: boolean, position: Position): void {
		super.setEditorVisible(visible, position);
	}

	/**
	 * Changes the position of the editor.
	 */
	public changePosition(position: Position): void {
		super.changePosition(position);
	}

	/**
	 * Called to indicate to the editor that the input should be cleared and resources associated with the
	 * input should be freed.
	 */
	public clearInput(): void {
		this._disposeEditors();
		super.clearInput();
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
		this._dimension = dimension;
	}

	public dispose(): void {
		this._disposeEditors();
		super.dispose();
	}

	public close(): void {
		this.input.close();
	}

	/**
	 * Returns true if the results table for the current edit data session is visible
	 * Public for testing only.
	 */
	public _isResultsEditorVisible(): boolean {
		if (!this.editDataInput) {
			return false;
		}
		return this.editDataInput.visible;
	}

	/**
	 * Makes visible the results table for the current edit data session
	 */
	private _showTableView(): void {
		if (this._isResultsEditorVisible()) {
			return;
		}

		this._createTableViewContainer();
		this._setTableViewVisible();
		this.setInput(this.editDataInput, this.options);
	}

	// PRIVATE METHODS ////////////////////////////////////////////////////////////
	private _updateTaskbar(owner: EditDataInput): void {
		// Update the taskbar if the owner of this call is being presented
		if (owner.matches(this.editDataInput)) {
			this._refreshTableAction.enabled = owner.refreshButtonEnabled;
			this._stopRefreshTableAction.enabled = owner.stopButtonEnabled;
		}
	}

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
		let textSeperator = QueryTaskbar.createTaskbarText(nls.localize('maxRowTaskbar', 'Max Rows:'));

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
				this._createTableViewContainer();
				let uri: string = newInput.uri;
				if (uri) {
					this._queryModelService.refreshResultsets(uri);
				}
			}

			returnValue = this._setNewInput(newInput, options);
		} else {
			this._setNewInput(newInput, options);
			returnValue = TPromise.as(null);
		}

		this._updateTaskbar(newInput);
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
			return this._bootstrapAngularAndResults(newInput, options);
		}

		return TPromise.as(undefined);
	}
	/**
	 * Appends the HTML for the edit data table view
	 */
	private _createTableViewContainer() {
		const parentElement = this.getContainer().getHTMLElement();

		if (!this.editDataInput.container) {
			this._resultsEditorContainer = DOM.append(parentElement, DOM.$('.editDataEditor'));
			this.editDataInput.container = this._resultsEditorContainer;
		} else {
			this._resultsEditorContainer = DOM.append(parentElement, this.editDataInput.container);
		}
	}

	private _disposeEditors(): void {
		if (this._resultsEditorContainer) {
			this._resultsEditorContainer.remove();
			this._resultsEditorContainer = null;
		}
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private _bootstrapAngularAndResults(input: EditDataInput, options: EditorOptions): TPromise<void> {
		super.setInput(input, options);
		if (!input.hasBootstrapped) {
			let uri = this.editDataInput.uri;

			// Pass the correct DataService to the new angular component
			let dataService = this._queryModelService.getDataService(uri);
			if (!dataService) {
				throw new Error('DataService not found for URI: ' + uri);
			}
			this._angularParameterService.dataService = dataService;

			this.editDataInput.setBootstrappedTrue();

			const parent = this._resultsEditorContainer;
			append(parent, $('slickgrid-container.slickgridContainer'));

			// Bootstrap the angular content
			let providers = [{ provide: 'ParameterService', useValue: this._angularParameterService }];
			AngularPlatformBrowserDynamic.platformBrowserDynamic(providers).bootstrapModule(AppModule);

		}
		return TPromise.as<void>(null);
	}

	private _setTableViewVisible(): void {
		this.editDataInput.setVisibleTrue();
	}
}
