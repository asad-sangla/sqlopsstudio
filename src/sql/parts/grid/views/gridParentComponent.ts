/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/parts/grid/media/slickColorTheme';
import 'vs/css!sql/parts/grid/media/flexbox';
import 'vs/css!sql/parts/grid/media/styles';
import 'vs/css!sql/parts/grid/media/slick.grid';
import 'vs/css!sql/parts/grid/media/slickGrid';

import { ElementRef, QueryList, ChangeDetectorRef } from '@angular/core';
import { IGridDataRow, ISlickRange, SlickGrid, FieldType } from 'angular2-slickgrid';
import * as Constants from 'sql/parts/query/common/constants';
import { IGridInfo, IRange, IGridDataSet, SaveFormat, JsonFormat, ExcelFormat, CsvFormat  } from 'sql/parts/grid/common/interfaces';
import * as Utils from 'sql/parts/connection/common/utils';
import { DataService } from 'sql/parts/grid/services/dataService';
import { GridActionProvider } from 'sql/parts/grid/views/gridActions';
import * as Services from 'sql/parts/grid/services/sharedServices';
import * as GridContentEvents from 'sql/parts/grid/common/gridContentEvents';
import { IBootstrapService } from 'sql/parts/bootstrap/bootstrapService';
import * as WorkbenchUtils from 'sql/parts/common/sqlWorkbenchUtils';

import { IAction } from 'vs/base/common/actions';
import { ResolvedKeybinding } from 'vs/base/common/keyCodes';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';

declare let AngularCore;
declare let rangy;
declare let jQuery;

export abstract class GridParentComponent {
	// CONSTANTS
	// tslint:disable:no-unused-variable
	protected selectionModel = 'DragRowSelectionModel';
	protected slickgridPlugins = ['AutoColumnSize'];
	protected _rowHeight = 29;
	protected _defaultNumShowingRows = 8;
	protected Constants = Constants;
	protected Utils = Utils;
	// tslint:disable-next-line:no-unused-variable
	protected startString = new Date().toLocaleTimeString();

	protected shortcutfunc: { [name: string]: Function };

	// tslint:enable

	// FIELDS
	// Service for interaction with the IQueryModel
	protected dataService: DataService;
	protected keybindingService: IKeybindingService;
	protected contextKeyService: IContextKeyService;
	protected contextMenuService: IContextMenuService;
	protected actionProvider: GridActionProvider;

	// All datasets
	// Place holder data sets to buffer between data sets and rendered data sets
	protected placeHolderDataSets: IGridDataSet[] = [];
	// Datasets currently being rendered on the DOM
	protected renderedDataSets: IGridDataSet[] = this.placeHolderDataSets;
	protected resultActive = true;
	protected _messageActive = true;
	protected activeGrid = 0;

	@AngularCore.ViewChildren('slickgrid') slickgrids: QueryList<SlickGrid>;

	// Edit Data functions
	public onCellEditEnd: (event: {row: number, column: number, newValue: any}) => void;
	public onCellEditBegin: (event: {row: number, column: number}) => void;
	public onRowEditBegin: (event: {row: number}) => void;
	public onRowEditEnd: (event: {row: number}) => void;
	public onIsCellEditValid: (row: number, column: number, newValue: any) => boolean;
	public onIsColumnEditable: (column: number) => boolean;
	public overrideCellFn: (rowNumber, columnId, value?, data?) => string;
	public loadDataFunction: (offset: number, count: number) => Promise<IGridDataRow[]>;

	set messageActive(input: boolean) {
		this._messageActive = input;
		if (this.resultActive) {
			this.resizeGrids();
		}
	}

	get messageActive(): boolean {
		return this._messageActive;
	}

	constructor(
		protected _el: ElementRef,
		protected _cd: ChangeDetectorRef,
		protected _bootstrapService: IBootstrapService
	) {
		this.actionProvider = new GridActionProvider();
	}

	protected baseInit(): void {
		const self = this;
		this.initShortcutsBase();

		this.dataService.gridContentObserver.subscribe((type) => {
			switch (type) {
				case GridContentEvents.RefreshContents:
					 self.refreshResultsets();
					break;
				case GridContentEvents.ResizeContents:
					self.resizeGrids();
					break;
				default:
					console.error('Unexpected grid content event type "' + type + '" sent');
					break;
			}
		});

		this.contextMenuService = this._bootstrapService.contextMenuService;
		this.keybindingService = this._bootstrapService.keybindingService;
		this.keybindingService.lookupKeybindings("query.copy");
		if (this._bootstrapService.contextKeyService) {
			this.contextKeyService = this._bootstrapService.contextKeyService.createScoped(this._el.nativeElement);
		}
	}

	private initShortcutsBase(): void {
		let shortcuts = {
			'event.toggleResultPane': () => {
				this.resultActive = !this.resultActive;
			},
			'event.toggleMessagePane': () => {
				this.messageActive = !this.messageActive;
			},
			'event.copySelection': () => {
				let range: IRange = this.getSelectedRangeUnderMessages();
				let messageText = range ? range.text() : '';
				if (messageText.length > 0) {
					WorkbenchUtils.executeCopy(messageText);
				} else {
					let activeGrid = this.activeGrid;
					let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
					this.dataService.copyResults(selection, this.renderedDataSets[activeGrid].batchId, this.renderedDataSets[activeGrid].resultId);
				}
			},
			'event.copyWithHeaders': () => {
				let activeGrid = this.activeGrid;
				let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
				this.dataService.copyResults(selection, this.renderedDataSets[activeGrid].batchId,
					this.renderedDataSets[activeGrid].resultId, true);
			},
			'event.selectAll': () => {
				this.slickgrids.toArray()[this.activeGrid].selection = true;
			},
			'event.saveAsCSV': () => {
				this.sendSaveRequest(CsvFormat);
			},
			'event.saveAsJSON': () => {
				this.sendSaveRequest(JsonFormat);
			},
			'event.saveAsExcel': () => {
				this.sendSaveRequest(ExcelFormat);
			}
		};

		this.initShortcuts(shortcuts);
		this.shortcutfunc = shortcuts;
	}

	protected abstract initShortcuts(shortcuts: {[name: string]: Function}): void;

	/**
	 * Send save result set request to service
	 */
	handleContextClick(event: {type: string, batchId: number, resultId: number, index: number, selection: ISlickRange[]}): void {
		switch (event.type) {
			case 'savecsv':
				this.dataService.sendSaveRequest({batchIndex: event.batchId, resultSetNumber: event.resultId, format: CsvFormat, selection: event.selection});
				break;
			case 'savejson':
				this.dataService.sendSaveRequest({batchIndex: event.batchId, resultSetNumber: event.resultId, format: JsonFormat, selection: event.selection});
				break;
			case 'saveexcel':
				this.dataService.sendSaveRequest({batchIndex: event.batchId, resultSetNumber: event.resultId, format: ExcelFormat, selection: event.selection});
				break;
			case 'selectall':
				this.activeGrid = event.index;
				this.shortcutfunc['event.selectAll']();
				break;
			case 'copySelection':
				this.dataService.copyResults(event.selection, event.batchId, event.resultId);
				break;
			case 'copyWithHeaders':
				this.dataService.copyResults(event.selection, event.batchId, event.resultId, true);
				break;
			default:
				break;
		}
	}

	private sendSaveRequest(format: SaveFormat) {
			let activeGrid = this.activeGrid;
			let batchId = this.renderedDataSets[activeGrid].batchId;
			let resultId = this.renderedDataSets[activeGrid].resultId;
			let selection = this.slickgrids.toArray()[activeGrid].getSelectedRanges();
			this.dataService.sendSaveRequest({ batchIndex: batchId, resultSetNumber: resultId, format: format, selection: selection});
	}

	protected _keybindingFor(action: IAction): ResolvedKeybinding {
		var [kb] = this.keybindingService.lookupKeybindings(action.id);
		return kb;
	}

	openContextMenu(event: {x: number, y: number}, batchId, resultId, index): void {
		let selection = this.slickgrids.toArray()[index].getSelectedRanges();
		let actionContext: IGridInfo = {
			batchIndex: batchId,
			resultSetNumber: resultId,
			selection: selection,
			gridIndex: index
		};

		let anchor = { x: event.x + 1, y: event.y };
		this.contextMenuService.showContextMenu({
			getAnchor: () => anchor,
			getActions: () => this.actionProvider.getGridActions(this.dataService, this.onGridSelectAll()),
			getKeyBinding: (action) => this._keybindingFor(action),
			onHide: (wasCancelled?: boolean) => {
			},
			getActionsContext: () => (actionContext)
		});
	}

	/**
	 * Returns a function that selects all elements of a grid. This needs to
	 * return a function in order to capture the scope for this component
	 * @private
	 * @returns {(gridIndex: number) => void}
	 *
	 * @memberOf QueryComponent
	 */
	protected onGridSelectAll(): (gridIndex: number) => void {
		let self = this;
		return (gridIndex: number) => {
			self.activeGrid = gridIndex;
			self.slickgrids.toArray()[this.activeGrid].selection = true;
		};
	}

	/**
	 * Used to convert the string to a enum compatible with SlickGrid
	 */
	protected stringToFieldType(input: string): FieldType {
		let fieldtype: FieldType;
		switch (input) {
			case 'string':
				fieldtype = FieldType.String;
				break;
			default:
				fieldtype = FieldType.String;
				break;
		}
		return fieldtype;
	}

	/**
	 * Makes a resultset take up the full result height if this is not already true
	 * Otherwise rerenders the result sets from default
	 */
	magnify(index: number): void {
		const self = this;
		if (this.renderedDataSets.length > 1) {
			this.renderedDataSets = [this.placeHolderDataSets[index]];
		} else {
			this.renderedDataSets = this.placeHolderDataSets;
			this.onScroll(0);
		}
		setTimeout(() => {
			for (let grid of self.renderedDataSets) {
				grid.resized.emit();
			}
			self.slickgrids.toArray()[0].setActive();
		});
	}

	abstract onScroll(scrollTop): void;

	/**
	 * Force angular to re-render the results grids. Calling this upon unhide (upon focus) fixes UI
	 * glitches that occur when a QueryRestulsEditor is hidden then unhidden while it is running a query.
	 */
	refreshResultsets(): void {
		let tempRenderedDataSets = this.renderedDataSets;
		this.renderedDataSets = [];
		this._cd.detectChanges();
		this.renderedDataSets = tempRenderedDataSets;
		this._cd.detectChanges();
	}

	getSelectedRangeUnderMessages(): IRange {
		let selectedRange: IRange = undefined;
		let msgEl = this._el.nativeElement.querySelector('#messages');
		if (msgEl) {
			selectedRange = this.getSelectedRangeWithin(msgEl);
		}
		return selectedRange;
	}

	getSelectedRangeWithin(el): IRange {
		let selectedRange = undefined;
		let sel = rangy.getSelection();
		let elRange = <IRange> rangy.createRange();
		elRange.selectNodeContents(el);
		if (sel.rangeCount) {
			selectedRange = sel.getRangeAt(0).intersection(elRange);
		}
		elRange.detach();
		return selectedRange;
	}

	selectAllMessages(): void {
		let msgEl = this._el.nativeElement.querySelector('#messages');
		this.selectElementContents(msgEl);
	}

	selectElementContents(el): void {
		let range = rangy.createRange();
		range.selectNodeContents(el);
		let sel = rangy.getSelection();
		sel.setSingleRange(range);
	}

	/**
	 * Add handler for clicking on xml link
	 */
	xmlLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
		const self = this;
		self.handleLink(cellRef, row, dataContext, colDef, 'xml');
	}

	/**
	 * Add handler for clicking on json link
	 */
	jsonLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
		const self = this;
		self.handleLink(cellRef, row, dataContext, colDef, 'json');
	}

	private handleLink(cellRef: string, row: number, dataContext: JSON, colDef: any, linkType: string): void {
		const self = this;
		let value = self.getCellValueString(dataContext, colDef);
		$(cellRef).children('.xmlLink').click(function(): void {
			self.dataService.openLink(value, colDef.name, linkType);
		});
	}

	private getCellValueString(dataContext: JSON, colDef: any): string {
		let returnVal = '';
		let value = dataContext[colDef.field];
		if (Services.DBCellValue.isDBCellValue(value)) {
			returnVal = value.displayValue;
		} else if (typeof value === 'string') {
			returnVal = value;
		}
		return returnVal;
	}

	/**
	 * Return asyncPostRender handler based on type
	 */
	public linkHandler(type: string): Function {
		if (type === 'xml') {
			return this.xmlLinkHandler;
		} else { // default to JSON handler
			return this.jsonLinkHandler;
		}
	}

	keyEvent(e): void {
		if (!this.tryHandleKeyEvent(e)) {

		}
	}


	/**
	 * Called by keyEvent method to give child classes a chance to
	 * handle key events.
	 *
	 * @protected
	 * @abstract
	 * @param {any} e
	 * @returns {boolean}
	 *
	 * @memberOf GridParentComponent
	 */
	protected abstract tryHandleKeyEvent(e): boolean;

	resizeGrids(): void {
		const self = this;
		setTimeout(() => {
			for (let grid of self.renderedDataSets) {
					grid.resized.emit();
				}
		});
	}

	// Private Helper Functions ////////////////////////////////////////////////////////////////////////////
}
