/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/grid/media/slickColorTheme';
import 'vs/css!sql/parts/grid/media/flexbox';
import 'vs/css!sql/parts/grid/media/styles';
import 'vs/css!sql/parts/grid/media/slick.grid';
import 'vs/css!sql/parts/grid/media/slickGrid';

import { ElementRef, QueryList, ChangeDetectorRef, OnInit } from '@angular/core';
import { IGridDataRow, SlickGrid, VirtualizedCollection, FieldType } from 'angular2-slickgrid';
import * as Constants from 'sql/parts/connection/common/constants';
import { IMessage, IRange, IGridDataSet  } from 'sql/parts/grid/common/interfaces';
import * as Utils from 'sql/parts/connection/common/utils';
import { DataService } from 'sql/parts/grid/services/dataService';
import * as Services from 'sql/parts/grid/services/sharedServices';
import * as GridContentEvents from 'sql/parts/grid/common/gridContentEvents';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/parts/bootstrap/bootstrapService';
import { EditDataComponentParams } from 'sql/parts/bootstrap/bootstrapParams';

declare let AngularCore;
declare let rangy;
declare let jQuery;

AngularCore.enableProdMode();

const template = `
<div class="fullsize vertBox">
    <div id="results" *ngIf="renderedDataSets.length > 0" class="results vertBox scrollable"
         (onScroll)="onScroll($event)" [class.hidden]="!resultActive">
        <div class="boxRow content horzBox slickgrid editable" *ngFor="let dataSet of renderedDataSets; let i = index"
            [style.max-height]="dataSet.maxHeight" [style.min-height]="dataSet.minHeight">
            <slick-grid #slickgrid id="slickgrid_{{i}}" [columnDefinitions]="dataSet.columnDefinitions"
                        [ngClass]="i === activeGrid ? 'active' : ''"
                        [dataRows]="dataSet.dataRows"
                        enableAsyncPostRender="true"
                        showDataTypeIcon="false"
                        showHeader="true"
                        [resized]="dataSet.resized"
                        [plugins]="slickgridPlugins"
                        (cellEditBegin)="onCellEditBegin($event)"
                        (cellEditExit)="onCellEditEnd($event)"
                        (rowEditBegin)="onRowEditBegin($event)"
                        (rowEditExit)="onRowEditEnd($event)"
                        [isColumnEditable]="onIsColumnEditable"
                        [isCellEditValid]="onIsCellEditValid"
                        [overrideCellFn]="overrideCellFn"
                        enableEditing="true"
                        class="boxCol content vertBox slickgrid">
            </slick-grid>
        </div>
    </div>
</div>
`;

@AngularCore.Component({
    selector: 'slickgrid-container',
    host: { '(window:keydown)': 'keyEvent($event)', '(window:gridnav)': 'keyEvent($event)' },
    template: template,
    styles: [`
    .errorMessage {
        color: var(--color-error);
    }
    .batchMessage {
        padding-left: 20px;
    }
    `]
})

export class EditDataComponent implements OnInit {
    // CONSTANTS
    // tslint:disable:no-unused-variable
    private scrollTimeOutTime = 200;
    private windowSize = 50;
    private selectionModel = 'DragRowSelectionModel';
    private slickgridPlugins = ['AutoColumnSize'];
    private _rowHeight = 29;
    private _defaultNumShowingRows = 8;
    private Constants = Constants;
    private Utils = Utils;
    private startString = new Date().toLocaleTimeString();
    // tslint:enable

    // FIELDS
    // Service for interaction with the IQueryModel
    private dataService: DataService;
    // All datasets
    private dataSet: IGridDataSet;
    // Place holder data sets to buffer between data sets and rendered data sets
    private placeHolderDataSets: IGridDataSet[] = [];
    // Datasets currently being rendered on the DOM
    private renderedDataSets: IGridDataSet[] = this.placeHolderDataSets;
    private messages: IMessage[] = [];
    private scrollTimeOut: number;
    private messagesAdded = false;
    private scrollEnabled = true;
    private resultActive = true;
    private _messageActive = true;
    private firstRender = true;
    private resultsScrollTop = 0;
    private activeGrid = 0;
    private totalElapsedTimeSpan: number;
    private complete = false;
    private newRow: {exists: boolean, rowIndex: number} = {exists: false, rowIndex: undefined};
    private idMapping: { [row: number]: number } = {};

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
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ElementRef)) private _el: ElementRef,
        @AngularCore.Inject(AngularCore.forwardRef(() => AngularCore.ChangeDetectorRef)) private cd: ChangeDetectorRef,
        @AngularCore.Inject(BOOTSTRAP_SERVICE_ID) private _bootstrapService: IBootstrapService
    ) {
        let uri: string = this._el.nativeElement.id;
		this._el.nativeElement.removeAttribute('id');
        let editDataParameters: EditDataComponentParams = this._bootstrapService.getBootstrapParams(uri);
        this.dataService = editDataParameters.dataService;
    }

    /**
     * Called by Angular when the object is initialized
     */
    ngOnInit(): void {
        const self = this;

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
				case 'editSessionReady':
					self.handleEditSessionReady(self, event);
					break;
                default:
                    console.error('Unexpected query event type "' + event.type + '" sent');
                    break;
            }
            self.cd.detectChanges();
        });

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

        this.dataService.onAngularLoaded();
    }

    handleStart(self: EditDataComponent, event: any): void {
        self.messages = [];
        self.dataSet = undefined;
        self.placeHolderDataSets =  [];
        self.renderedDataSets = self.placeHolderDataSets;
        self.totalElapsedTimeSpan = undefined;
        self.complete = false;
        self.messagesAdded = false;

        // Hooking up edit functions
        this.onIsCellEditValid = (row, column, value): boolean => {
            // TODO can only run sync code
            return true;
        };

        this.onCellEditEnd = (event: {row: number, column: number, newValue: any}): void => {
            // Update the cell accordingly
            self.dataService.updateCell(this.idMapping[event.row], event.column, event.newValue)
            .then(
                result => {
                    self.setCellDirtyState(event.row, event.column+1, result.cell.isDirty);
                    self.setRowDirtyState(event.row, result.isRowDirty);
                },
                error => {
                    if (!this.newRow.exists) {
                        this.setGridClean();
                        this.refreshResultsets();
                    } else {
                        let slick: any = self.slickgrids.toArray()[0];
                        let grid = slick._grid;
                        self.setCellDirtyState(event.row, event.column+1, true);
                        self.setRowDirtyState(event.row, true);
                    }
                    this.focusCell(event.row, event.column+1);
                }
            );
        };

        this.onCellEditBegin = (event: {row: number, column: number}): void => {
            // Check if we tried to leave our 'create row' session
            if(this.leaveCreateRow(event.row)) {
                // Try to commit pending edits if we have left
                self.dataService.commitEdit().then(result => {
                    this.setGridClean();
                    this.newRow.exists = false;
                    // If we tried to leave into the null row then start a new edition session
                    if (this.isNullRow(event.row)) {
                        this.addRow(event.row, 1);
                    }
                }, error => {
                    // Upon error prevent user from leaving the create session
                    this.focusCell(this.dataSet.totalRows-2, event.column+1);
                });

            // If we started editing a new cell in a 'new row' and we are not in a create session
            } else if (this.isNullRow(event.row) && !this.newRow.exists) {
                // Add a new row to slickgrid
                this.addRow(event.row, 1);
            }
        };

        this.onRowEditBegin = (event: {row: number}): void => {

        };

        this.onRowEditEnd = (event: {row: number}): void => {
            // Check if we left a new row
            if (!this.newRow.exists) {
                self.dataService.commitEdit().then(result => {
                    this.setGridClean();
                }, error => {
                    // TODO create formal slickgrid api for these actions
                    this.setGridClean();
                    this.dataService.revertRow(self.idMapping[event.row])
                    .then(
                        result => {
                            this.refreshResultsets();
                            this.focusCell(event.row, 1);
                    });
                });
            }
        };

        this.onIsColumnEditable = (column: number): boolean => {
            let result = false;
            // Check that our variables exist
            if (column !== undefined && !!this.dataSet && !!this.dataSet.columnDefinitions[column]) {
                result = this.dataSet.columnDefinitions[column].isEditable;
            }

            // If no column definition exists then the row is not editable
            return result;
        };

        this.overrideCellFn = (rowNumber, columnId, value?, data?): string => {
            let returnVal = '';
            if (Services.DBCellValue.isDBCellValue(value)) {
                returnVal = value.displayValue;
            } else if (typeof value === 'string') {
                returnVal = value;
            }
            return returnVal;
        };

        // Setup a function for generating a promise to lookup result subsets
        this.loadDataFunction = (offset: number, count: number): Promise<IGridDataRow[]> => {
            return new Promise<IGridDataRow[]>((resolve, reject) => {
                self.dataService.getEditRows(offset, count).subscribe(result => {
                    let rowIndex = offset;
                    let gridData: IGridDataRow[] = result.subset.map(row => {
                        this.idMapping[rowIndex] = row.id;
                        rowIndex++;
                        return {values: row.cells, row: row.id};
                    });

                    // Append a NULL row to the end of gridData
                    let lastRow = gridData[gridData.length-1];
                    gridData.push({values: lastRow.values.map(cell => {return {displayValue: 'NULL', isNull: false};}), row: lastRow.row+1});
                    resolve(gridData);
                });
            });
        };
    }

    handleComplete(self: EditDataComponent, event: any): void {
        self.totalElapsedTimeSpan = event.data;
        self.complete = true;
        self.messagesAdded = true;
    }

	handleEditSessionReady(self, event): void {
		// TODO: update when edit session is ready
	}

    handleMessage(self: EditDataComponent, event: any): void {
		// TODO: what do we do with messages?
    }

    handleResultSet(self: EditDataComponent, event: any): void {
        // Add an extra 'new row'
        event.data.rowCount++;
        let resultSet = event.data;

        // Precalculate the max height and min height
        let maxHeight = this.getMaxHeight(resultSet.rowCount);
        let minHeight = this.getMinHeight(resultSet.rowCount);

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
                this.loadDataFunction,
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
                    asyncPostRender: isLinked ? self.linkHandler(linkType) : undefined,
                    isEditable: c.isUpdatable
                };
            })
        };
        self.dataSet = dataSet;

        // Create a dataSet to render without rows to reduce DOM size
        let undefinedDataSet = JSON.parse(JSON.stringify(dataSet));
        undefinedDataSet.columnDefinitions = dataSet.columnDefinitions;
        undefinedDataSet.dataRows = undefined;
        undefinedDataSet.resized = new AngularCore.EventEmitter();
        self.placeHolderDataSets.push(undefinedDataSet);
        self.messagesAdded = true;
        self.onScroll(0);
    }

    /**
     * Force angular to re-render the results grids. Calling this upon unhide (upon focus) fixes UI
     * glitches that occur when a QueryRestulsEditor is hidden then unhidden while it is running a query.
     */
    refreshResultsets(): void {
        let tempRenderedDataSets = this.renderedDataSets;
        this.renderedDataSets = [];
        this.cd.detectChanges();
        this.renderedDataSets = tempRenderedDataSets;
        this.cd.detectChanges();
    }

    /**
     * Used to convert the string to a enum compatible with SlickGrid
     */
    private stringToFieldType(input: string): FieldType {
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

    // Copy text as text
    executeCopy(text: string): void {
        let input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = text;
        input.style.position = 'absolute';
        input.style.bottom = '100%';
        input.focus();
        input.select();
        document.execCommand('copy');
        input.remove();
    }

    /**
     * Add handler for clicking on xml link
     */
    xmlLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
        const self = this;
        let value = dataContext[colDef.field];
        $(cellRef).children('.xmlLink').click(function(): void {
            self.dataService.openLink(value, colDef.name, 'xml');
        });
    }

    /**
     * Add handler for clicking on json link
     */
    jsonLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
        const self = this;
        let value = dataContext[colDef.field];
        $(cellRef).children('.xmlLink').click(function(): void {
            self.dataService.openLink(value, colDef.name, 'json');
        });
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

    /**
     * Handles rendering the results to the DOM that are currently being shown
     * and destroying any results that have moved out of view
     * @param scrollTop The scrolltop value, if not called by the scroll event should be 0
     */
    onScroll(scrollTop): void {
        const self = this;
        clearTimeout(self.scrollTimeOut);
        this.scrollTimeOut = setTimeout(() => {
            self.scrollEnabled = false;
            for (let i = 0; i < self.placeHolderDataSets.length; i++) {
                self.placeHolderDataSets[i].dataRows = self.dataSet.dataRows;
                self.placeHolderDataSets[i].resized.emit();
            }


            self.cd.detectChanges();

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

    keyEvent(e): void {
        // If the esc key was pressed while in a create session
        if (e.keyCode === jQuery.ui.keyCode.ESCAPE && this.newRow.exists) {
            // revert our last new row
            this.dataService.revertRow(this.idMapping[this.newRow.rowIndex]);
            this.newRow.exists = false;
            this.removeRow(this.newRow.rowIndex-1, 1);
        }
    }

    resizeGrids(): void {
        const self = this;
        setTimeout(() => {
            for (let grid of self.renderedDataSets) {
                    grid.resized.emit();
                }
        });
    }

    // Private Helper Functions ////////////////////////////////////////////////////////////////////////////

    // Checks if input row is our NULL new row
    private isNullRow(row: number): boolean {
        // Null row is always at index (totalRows - 1)
        return (row === this.dataSet.totalRows-1);
    }

    // Checks if the input row is leaving a create row session
    private leaveCreateRow(row: number): boolean {
        // Temp row is always at index (totalRows -1) when it exists
        return (this.newRow.exists && !(row === this.dataSet.totalRows-2));
    }

    // Adds CSS classes to slickgrid cells to indicate a dirty state
    private setCellDirtyState(row: number, column: number, dirtyState: boolean): void {
        let slick: any = this.slickgrids.toArray()[0];
        let grid = slick._grid;
        if (dirtyState) {
            // Change cell color
            $(grid.getCellNode(row, column)).addClass('dirtyCell').removeClass('selected');
        } else {
            $(grid.getCellNode(row,column)).removeClass('dirtyCell');
        }
    }

    // Adds CSS classes to slickgrid rows to indicate a dirty state
    private setRowDirtyState(row: number, dirtyState:boolean): void {
        let slick: any = this.slickgrids.toArray()[0];
        let grid = slick._grid;
        if (dirtyState) {
            // Change row header color
            $(grid.getCellNode(row, 0)).addClass('dirtyRowHeader');
        } else {
            $(grid.getCellNode(row, 0)).removeClass('dirtyRowHeader');
        }
    }

    // Sets CSS to clean the entire grid of dirty state cells and rows
    private setGridClean(): void {
        // Remove dirty classes from the entire table
        let allRows = $($('.grid-canvas').children());
        let allCells = $(allRows.children());
        allCells.removeClass('dirtyCell').removeClass('dirtyRowHeader');
    }

    // Adds an extra row to the end of slickgrid (just for rendering purposes)
    // Then sets the focused call afterwards
    private addRow(row: number, column: number): void {
        this.dataService.createRow();
        this.newRow.rowIndex = row;
        this.newRow.exists = true;
        // Adding an extra row for 'new row' functionality
        this.dataSet.totalRows++;
        this.dataSet.maxHeight = this.getMaxHeight(this.dataSet.totalRows);
        this.dataSet.minHeight = this.getMinHeight(this.dataSet.totalRows);
        this.dataSet.dataRows = new VirtualizedCollection(
            this.windowSize,
            this.dataSet.totalRows,
            this.loadDataFunction,
            index => { return { values: [] }; }
        );
        // Refresh grid
        this.onScroll(0);

        // Set focused cell
        setTimeout(() => {
            this.focusCell(row, column);
            this.setRowDirtyState(row, true);
        }, this.scrollTimeOutTime);
    }

    // Adds a row from the end of slickgrid (just for rendering purposes)
    // Then sets the focused call afterwards
    private removeRow(row: number, column: number): void {
        // Removing the new row
        this.dataSet.totalRows--;
        this.dataSet.dataRows = new VirtualizedCollection(
            this.windowSize,
            this.dataSet.totalRows,
            this.loadDataFunction,
            index => { return { values: [] }; }
        );

        // refresh results view
        this.onScroll(0);

        // focus the above row
        setTimeout(() => {
            this.focusCell(row, column);
        }, this.scrollTimeOutTime);
    }

    private focusCell(row: number, column: number): void {
        let slick: any = this.slickgrids.toArray()[0];
        let grid = slick._grid;
        grid.gotoCell(row, column, true);
    }

    private getMaxHeight(rowCount: number): any {
        return rowCount < this._defaultNumShowingRows
            ? ((rowCount + 1) * this._rowHeight) + 10
            : 'inherit';
    }

    private getMinHeight(rowCount: number): any {
        return rowCount > this._defaultNumShowingRows
            ? (this._defaultNumShowingRows + 1) * this._rowHeight + 10
            : this.getMaxHeight(rowCount);
    }
}
