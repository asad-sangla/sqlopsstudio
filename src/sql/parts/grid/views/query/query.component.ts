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

import * as Constants from 'sql/parts/query/common/constants';
import * as Services from 'sql/parts/grid/services/sharedServices';

import { ElementRef, QueryList, ChangeDetectorRef, OnInit } from '@angular/core';
import { IGridDataRow, SlickGrid, VirtualizedCollection } from 'angular2-slickgrid';
import { IGridIcon, IMessage, IRange, IGridDataSet } from 'sql/parts/grid/common/interfaces';
import { GridParentComponent } from 'sql/parts/grid/views/gridParentComponent';
import { GridActionProvider } from 'sql/parts/grid/views/gridActions';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';
import { QueryComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import * as WorkbenchUtils from 'sql/parts/common/sqlWorkbenchUtils';

declare let AngularCore;
declare let rangy;

export const QUERY_SELECTOR: string = 'query-component';

@AngularCore.Component({
	selector: QUERY_SELECTOR,
	templateUrl: require.toUrl('sql/parts/grid/views/query/query.template.html')
})

export class QueryComponent extends GridParentComponent implements OnInit {
	// CONSTANTS
	// tslint:disable-next-line:no-unused-variable
	private scrollTimeOutTime = 200;
	private windowSize = 50;
	private messagePaneHeight = 22;
	// tslint:disable-next-line:no-unused-variable
	private maxScrollGrids = 8;
	// tslint:disable-next-line:no-unused-variable
	private progressAnimationUri = require.toUrl('sql/parts/grid/media/progress_36x_animation.gif');

	// tslint:disable-next-line:no-unused-variable
	private dataIcons: IGridIcon[] = [
		{
			showCondition: () => { return this.dataSets.length > 1; },
			icon: () => {
				return this.renderedDataSets.length === 1
					? 'exitFullScreen'
					: 'extendFullScreen';
			},
			hoverText: () => {
				return this.renderedDataSets.length === 1
					? Constants.restoreLabel
					: Constants.maximizeLabel;
			},
			functionality: (batchId, resultId, index) => {
				this.magnify(index);
			}
		},
		{
			showCondition: () => { return true; },
			icon: () => { return 'saveCsv'; },
			hoverText: () => { return Constants.saveCSVLabel; },
			functionality: (batchId, resultId, index) => {
				let selection = this.slickgrids.toArray()[index].getSelectedRanges();
				if (selection.length <= 1) {
					this.handleContextClick({type: 'savecsv', batchId: batchId, resultId: resultId, index: index, selection: selection});
				} else {
					this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
				}
			}
		},
		{
			showCondition: () => { return true; },
			icon: () => { return 'saveJson'; },
			hoverText: () => { return Constants.saveJSONLabel; },
			functionality: (batchId, resultId, index) => {
				let selection = this.slickgrids.toArray()[index].getSelectedRanges();
				if (selection.length <= 1) {
					this.handleContextClick({type: 'savejson', batchId: batchId, resultId: resultId, index: index, selection: selection});
				} else {
					this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
				}
			}
		},
		{
			showCondition: () => { return true; },
			icon: () => { return 'saveExcel'; },
			hoverText: () => { return Constants.saveExcelLabel; },
			functionality: (batchId, resultId, index) => {
				let selection = this.slickgrids.toArray()[index].getSelectedRanges();
				if (selection.length <= 1) {
					this.handleContextClick({type: 'saveexcel', batchId: batchId, resultId: resultId, index: index, selection: selection});
				} else {
					this.dataService.showWarning(Constants.msgCannotSaveMultipleSelections);
				}
			}
		}
	];

	// FIELDS
	// Service for interaction with the IQueryModel

	// All datasets
	private dataSets: IGridDataSet[] = [];
	private messages: IMessage[] = [];
	private scrollTimeOut: number;
	private resizing = false;
	private resizeHandleTop: string = '0';
	private scrollEnabled = true;
	// tslint:disable-next-line:no-unused-variable
	private firstRender = true;
	private totalElapsedTimeSpan: number;
	private complete = false;

	@AngularCore.ViewChildren('slickgrid') slickgrids: QueryList<SlickGrid>;

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
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) el: ElementRef,
		@AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) cd: ChangeDetectorRef,
		@AngularCore.Inject(BOOTSTRAP_SERVICE_ID) bootstrapService: IBootstrapService
	) {
		super(el, cd, bootstrapService);
		this._el.nativeElement.className = 'slickgridContainer';
		let queryParameters: QueryComponentParams = this._bootstrapService.getBootstrapParams(this._el.nativeElement.tagName);
		this.dataService = queryParameters.dataService;

		this.actionProvider = new GridActionProvider();
	}

	/**
	 * Called by Angular when the object is initialized
	 */
	ngOnInit(): void {
		const self = this;
		this.baseInit();
		this.setupResizeBind();

		this.dataService.queryEventObserver.subscribe(event => {
			switch (event.type) {
				case 'start':
					self.handleStart(self, event);
					break;
				case 'complete':
					self.handleComplete(self, event);
					break;
				case 'message':
					self.handleMessage(self, event);
					break;
				case 'resultSet':
					self.handleResultSet(self, event);
					break;
				default:
					console.error('Unexpected query event type "' + event.type + '" sent');
					break;
			}
			self._cd.detectChanges();
		});

		this.dataService.onAngularLoaded();
	}

	protected initShortcuts(shortcuts: {[name: string]: Function}): void {
		shortcuts['event.nextGrid'] = () => {
			this.navigateToGrid(this.activeGrid + 1);
		};
		shortcuts['event.prevGrid'] = () => {
			this.navigateToGrid(this.activeGrid - 1);
		};
		shortcuts['event.maximizeGrid'] = () => {
			this.magnify(this.activeGrid);
		};
	}

	handleStart(self: QueryComponent, event: any): void {
		self.messages = [];
		self.dataSets = [];
		self.placeHolderDataSets =  [];
		self.renderedDataSets = self.placeHolderDataSets;
		self.totalElapsedTimeSpan = undefined;
		self.complete = false;
		self.activeGrid = 0;
	}

	handleComplete(self: QueryComponent, event: any): void {
		self.totalElapsedTimeSpan = event.data;
		self.complete = true;
	}

	handleMessage(self: QueryComponent, event: any): void {
		self.messages.push(event.data);
		self._cd.detectChanges();
		this.scrollMessages();
	}

	handleResultSet(self: QueryComponent, event: any): void {
		let resultSet = event.data;

		// Setup a function for generating a promise to lookup result subsets
		let loadDataFunction = (offset: number, count: number): Promise<IGridDataRow[]> => {
			return new Promise<IGridDataRow[]>((resolve, reject) => {
				self.dataService.getQueryRows(offset, count, resultSet.batchId, resultSet.id).subscribe(rows => {
					let gridData: IGridDataRow[] = [];
					for (let row = 0; row < rows.rows.length; row++) {
						// Push row values onto end of gridData for slickgrid
						gridData.push({
							values: rows.rows[row]
						});
					}
					resolve(gridData);
				});
			});
		};

		// Precalculate the max height and min height
		let maxHeight: string = 'inherit';
		if (resultSet.rowCount < self._defaultNumShowingRows) {
			let maxHeightNumber: number = Math.max((resultSet.rowCount + 1) * self._rowHeight, self.dataIcons.length * 30) + 10;
			maxHeight = maxHeightNumber.toString() + 'px';
		}

		let minHeight: string = maxHeight;
		if (resultSet.rowCount >= self._defaultNumShowingRows) {
			let minHeightNumber: number = (self._defaultNumShowingRows + 1) * self._rowHeight + 10;
			minHeight = minHeightNumber.toString() + 'px';
		}

		// Store the result set from the event
		let dataSet: IGridDataSet = {
			resized: undefined,
			batchId: resultSet.batchId,
			resultId: resultSet.id,
			totalRows: resultSet.rowCount,
			maxHeight: maxHeight,
			minHeight: minHeight,
			dataRows: new VirtualizedCollection(
				self.windowSize,
				resultSet.rowCount,
				loadDataFunction,
				index => { return { values: [] }; }
			),
			columnDefinitions: resultSet.columnInfo.map((c, i) => {
				let isLinked = c.isXml || c.isJson;
				let linkType = c.isXml ? 'xml' : 'json';
				return {
					id: i.toString(),
					name: c.columnName === 'Microsoft SQL Server 2005 XML Showplan'
						? 'XML Showplan'
						: c.columnName,
					type: self.stringToFieldType('string'),
					formatter: isLinked ? Services.hyperLinkFormatter : Services.textFormatter,
					asyncPostRender: isLinked ? self.linkHandler(linkType) : undefined
				};
			})
		};
		self.dataSets.push(dataSet);

		// Create a dataSet to render without rows to reduce DOM size
		let undefinedDataSet = JSON.parse(JSON.stringify(dataSet));
		undefinedDataSet.columnDefinitions = dataSet.columnDefinitions;
		undefinedDataSet.dataRows = undefined;
		undefinedDataSet.resized = new AngularCore.EventEmitter();
		self.placeHolderDataSets.push(undefinedDataSet);
		self.onScroll(0);
	}

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

	/**
	 * Perform copy and do other actions for context menu on the messages component
	 */
	handleMessagesContextClick(event: {type: string, selectedRange: IRange}): void {
		switch (event.type) {
			case 'copySelection':
				let selectedText = event.selectedRange.text();
				WorkbenchUtils.executeCopy(selectedText);
				break;
			case 'selectall':
				document.execCommand('selectAll');
				break;
			default:
				break;
		}
	}

	openMessagesContextMenu(event: any): void {
		let self = this;
		event.preventDefault();
		let selectedRange: IRange = this.getSelectedRangeUnderMessages();
		let selectAllFunc = () => self.selectAllMessages();
		let anchor = { x: event.x + 1, y: event.y };
		this.contextMenuService.showContextMenu({
			getAnchor: () => anchor,
			getActions: () => this.actionProvider.getMessagesActions(this.dataService, selectAllFunc),
			getKeyBinding: (action) => this._keybindingFor(action),
			onHide: (wasCancelled?: boolean) => {
			},
			getActionsContext: () => (selectedRange)
		});
	}


	/**
	 * Handles rendering the results to the DOM that are currently being shown
	 * and destroying any results that have moved out of view
	 * @param scrollTop The scrolltop value, if not called by the scroll event should be 0
	 */
	onScroll(scrollTop): void {
		const self = this;
		clearTimeout(self.scrollTimeOut);
		this.scrollTimeOut = setTimeout(() => {
			if (self.dataSets.length < self.maxScrollGrids) {
				self.scrollEnabled = false;
				for (let i = 0; i < self.placeHolderDataSets.length; i++) {
					self.placeHolderDataSets[i].dataRows = self.dataSets[i].dataRows;
					self.placeHolderDataSets[i].resized.emit();
				}
			} else {
				let gridHeight = self._el.nativeElement.getElementsByTagName('slick-grid')[0].offsetHeight;
				let tabHeight = self._el.nativeElement.querySelector('#results').offsetHeight;
				let numOfVisibleGrids = Math.ceil((tabHeight / gridHeight)
					+ ((scrollTop % gridHeight) / gridHeight));
				let min = Math.floor(scrollTop / gridHeight);
				let max = min + numOfVisibleGrids;
				for (let i = 0; i < self.placeHolderDataSets.length; i++) {
					if (i >= min && i < max) {
						if (self.placeHolderDataSets[i].dataRows === undefined) {
							self.placeHolderDataSets[i].dataRows = self.dataSets[i].dataRows;
							self.placeHolderDataSets[i].resized.emit();
						}
					} else if (self.placeHolderDataSets[i].dataRows !== undefined) {
						self.placeHolderDataSets[i].dataRows = undefined;
					}
				}
			}

			self._cd.detectChanges();

			if (self.firstRender) {
				let setActive = function() {
					if (self.firstRender && self.slickgrids.toArray().length > 0) {
						self.slickgrids.toArray()[0].setActive();
						self.firstRender = false;
					}
				};

				setTimeout(() => {
					setActive();
				});
			}
		}, self.scrollTimeOutTime);
	}

	/**
	 * Sets up the resize for the messages/results panes bar
	 */
	setupResizeBind(): void {
		const self = this;

		let resizeHandleElement: HTMLElement = self._el.nativeElement.querySelector('#messageResizeHandle');
		let $resizeHandle = $(resizeHandleElement);
		let $messages = $(self._el.nativeElement.querySelector('#messages'));

		$resizeHandle.bind('dragstart', (e) => {
			self.resizing = true;
			self.resizeHandleTop = self.calculateResizeHandleTop(e.pageY);
			self._cd.detectChanges();
			return true;
		});

		$resizeHandle.bind('drag', (e) => {
			// Update the animation if the drag is within the allowed range.
			if (self.isDragWithinAllowedRange(e.pageY, resizeHandleElement)) {
				self.resizeHandleTop = self.calculateResizeHandleTop(e.pageY);
				self.resizing = true;
				self._cd.detectChanges();

			// Stop the animation if the drag is out of the allowed range.
			// The animation is resumed when the drag comes back into the allowed range.
			} else {
				self.resizing = false;
			}
		});

		$resizeHandle.bind('dragend', (e) => {
			self.resizing = false;
			// Redefine the min size for the messages based on the final position
			// if the drag is within the allowed rang
			if (self.isDragWithinAllowedRange(e.pageY, resizeHandleElement)) {
				let minHeightNumber = this.getMessagePaneHeightFromDrag(e.pageY);
				$messages.css('min-height', minHeightNumber + 'px');
				self._cd.detectChanges();
				self.resizeGrids();

			// Otherwise just update the UI to show that the drag is complete
			} else {
				self._cd.detectChanges();
			}
		});
	}

	/**
	 * Returns true if the resize of the messagepane given by the drag at top=eventPageY is valid,
	 * false otherwise. A drag is valid if it is below the bottom of the resultspane and
	 * this.messagePaneHeight pixels above the bottom of the entire angular component.
	 */
	isDragWithinAllowedRange(eventPageY: number, resizeHandle: HTMLElement): boolean {
		let resultspaneElement: HTMLElement = this._el.nativeElement.querySelector('#resultspane');
		let minHeight = this.getMessagePaneHeightFromDrag(eventPageY);

		if (resultspaneElement &&
			minHeight > 0 &&
			resultspaneElement.getBoundingClientRect().bottom < eventPageY
		) {
			return true;
		}
		return false;
	}

	/**
	 * Calculates the position of the top of the resize handle given the Y-axis drag
	 * coordinate as eventPageY.
	 */
	calculateResizeHandleTop(eventPageY: number): string {
		let resultsWindowTop: number = this._el.nativeElement.getBoundingClientRect().top;
		let relativeTop: number = eventPageY - resultsWindowTop;
		return relativeTop + 'px';
	}

	/**
	 * Returns the height the message pane would be if it were resized so that its top would be set to eventPageY.
	 * This will return a negative value if eventPageY is below the bottom limit.
	 */
	getMessagePaneHeightFromDrag(eventPageY: number): number {
		let bottomDragLimit: number = this._el.nativeElement.getBoundingClientRect().bottom - this.messagePaneHeight;
		return bottomDragLimit - eventPageY;
	}

	/**
	 * Ensures the messages tab is scrolled to the bottom
	 */
	scrollMessages(): void {
		let messagesDiv = this._el.nativeElement.querySelector('#messages');
		messagesDiv.scrollTop = messagesDiv.scrollHeight;
	}

	/**
	 *
	 */
	protected tryHandleKeyEvent(e): boolean {
		if (e.detail) {
			e.which = e.detail.which;
			e.ctrlKey = e.detail.ctrlKey;
			e.metaKey = e.detail.metaKey;
			e.altKey = e.detail.altKey;
			e.shiftKey = e.detail.shiftKey;
		}
		return false;
		// let eString = this.shortcuts.buildEventString(e);
		// this.shortcuts.getEvent(eString).then((result) => {
		//     if (result) {
		//         let eventName = <string> result;
		//         self.shortcutfunc[eventName]();
		//         e.stopImmediatePropagation();
		//     }
		// });
	}

	/**
	 * Handles rendering and unrendering necessary resources in order to properly
	 * navigate from one grid another. Should be called any time grid navigation is performed
	 * @param targetIndex The index in the renderedDataSets to navigate to
	 * @returns A boolean representing if the navigation was successful
	 */
	navigateToGrid(targetIndex: number): boolean {
		// check if the target index is valid
		if (targetIndex >= this.renderedDataSets.length || targetIndex < 0) {
			return false;
		}

		// Deselect any text since we are navigating to a new grid
		// Do this even if not switching grids, since this covers clicking on the grid after message selection
		rangy.getSelection().removeAllRanges();

		// check if you are actually trying to change navigation
		if (this.activeGrid === targetIndex) {
			return false;
		}

		this.slickgrids.toArray()[this.activeGrid].selection = false;
		this.slickgrids.toArray()[targetIndex].setActive();
		this.activeGrid = targetIndex;

		// scrolling logic
		let resultsWindow = $('#results');
		let scrollTop = resultsWindow.scrollTop();
		let scrollBottom = scrollTop + resultsWindow.height();
		let gridHeight = $(this._el.nativeElement).find('slick-grid').height();
		if (scrollBottom < gridHeight * (targetIndex + 1)) {
			scrollTop += (gridHeight * (targetIndex + 1)) - scrollBottom;
			resultsWindow.scrollTop(scrollTop);
		}
		if (scrollTop > gridHeight * targetIndex) {
			scrollTop = (gridHeight * targetIndex);
			resultsWindow.scrollTop(scrollTop);
		}

		return true;
	}

	resizeGrids(): void {
		const self = this;
		setTimeout(() => {
			for (let grid of self.renderedDataSets) {
					grid.resized.emit();
				}
		});
	}

}