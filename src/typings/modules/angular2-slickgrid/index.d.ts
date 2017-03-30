// Generated by typings
// Source: node_modules/angular2-slickgrid/components/js/gridsync.service.d.ts
declare module '~angular2-slickgrid/components/js/gridsync.service' {
import { Observable } from 'rxjs/Rx';
import { SelectionModel } from '~angular2-slickgrid/components/js/selectionmodel';
export class GridSyncService {
    columnMinWidthPX: number;
    private _scrollLeftPX;
    private _scrollBarWidthPX;
    private _columnWidthPXs;
    private _rowNumberColumnWidthPX;
    private _updated;
    private _typeDropdownOffset;
    private _selectionModel;
    private _initialColumnWidthPXsOnResize;
    private _isGridReadOnly;
    initialColumnResize(): void;
    resizeColumn(index: number, deltaWidthPX: number): void;
    openTypeDropdown(columnIndex: number): void;
    private setColumnWidthPX(index, widthPX);
    underlyingSelectionModel: any;
    updated: Observable<string>;
    typeDropdownOffset: Observable<[number, number]>;
    scrollLeftPX: number;
    scrollBarWidthPX: number;
    columnWidthPXs: number[];
    rowNumberColumnWidthPX: number;
    selectionModel: SelectionModel;
    isGridReadOnly: boolean;
    private notifyUpdates(propertyName);
}
}
declare module 'angular2-slickgrid/components/js/gridsync.service' {
export * from '~angular2-slickgrid/components/js/gridsync.service';
}

// Generated by typings
// Source: node_modules/angular2-slickgrid/components/js/interfaces.d.ts
declare module '~angular2-slickgrid/components/js/interfaces' {
import { Observable } from 'rxjs/Rx';
export enum NotificationType {
    Error = 0,
    UpdateAvailable = 1,
    UpdateDownloaded = 2,
}
export interface ISelectionRange {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
}
export enum CollectionChange {
    ItemsReplaced = 0,
}
export interface IObservableCollection<T> {
    getLength(): number;
    at(index: number): T;
    getRange(start: number, end: number): T[];
    setCollectionChangedCallback(callback: (change: CollectionChange, startIndex: number, count: number) => void): void;
}
export class CancellationToken {
    private _isCanceled;
    private _canceled;
    cancel(): void;
    isCanceled: boolean;
    canceled: Observable<any>;
}
export enum FieldType {
    String = 0,
    Boolean = 1,
    Integer = 2,
    Decimal = 3,
    Date = 4,
    Unknown = 5,
}
export interface IColumnDefinition {
    id?: string;
    name: string;
    type: FieldType;
    asyncPostRender?: (cellRef: string, row: number, dataContext: JSON, colDef: any) => void;
    formatter?: (row: number, cell: any, value: any, columnDef: any, dataContext: any) => string;
    isEditable?: boolean;
}
export interface IGridColumnDefinition {
    id: string;
    type: number;
}
export interface IGridDataRow {
    row?: number;
    values: any[];
}
}
declare module 'angular2-slickgrid/components/js/interfaces' {
export * from '~angular2-slickgrid/components/js/interfaces';
}

// Generated by typings
// Source: node_modules/angular2-slickgrid/components/js/selectionmodel.d.ts
declare module '~angular2-slickgrid/components/js/selectionmodel' {
import { ISelectionRange } from '~angular2-slickgrid/components/js/interfaces';
export class SelectionModel implements ISlickSelectionModel {
    private _rowSelectionModel;
    private _handler;
    private _onSelectedRangesChanged;
    private _slickRangeFactory;
    constructor(_rowSelectionModel: ISlickSelectionModel, _handler: ISlickEventHandler, _onSelectedRangesChanged: ISlickEvent, _slickRangeFactory: (fromRow: number, fromCell: number, toRow: number, toCell: number) => ISlickRange);
    range: ISlickRange[];
    onSelectedRangesChanged: ISlickEvent;
    init(grid: ISlickGrid): void;
    destroy(): void;
    setSelectedRanges(ranges: ISlickRange[]): void;
    getSelectedRanges(): ISlickRange[];
    changeSelectedRanges(selections: ISelectionRange[]): void;
    toggleSingleColumnSelection(columnId: string): void;
    setSingleColumnSelection(columnId: string): void;
    toggleMultiColumnSelection(columnId: string): void;
    extendMultiColumnSelection(columnId: string): void;
    clearSelection(): void;
    private _grid;
    private _ranges;
    private _lastSelectedColumnIndexSequence;
    private static areRangesIdentical(lhs, rhs);
    private getColumnRange(columnId);
    private getColumnRangeByIndex(columnIndex);
    private isColumnSelectionCurrently;
    private updateSelectedRanges(ranges);
}
export interface ISlickSelectionModel {
    range: ISlickRange[];
    onSelectedRangesChanged: any;
    init(grid: any): void;
    destroy(): void;
    setSelectedRanges(ranges: ISlickRange[]): void;
    getSelectedRanges(): ISlickRange[];
}
export interface ISlickEventHandler {
    subscribe(event: any, handler: any): void;
    unsubscribeAll(): void;
}
export interface ISlickEvent {
    notify(eventData: ISlickRange[]): void;
    subscribe(handler: (e: any, args: any) => void): void;
}
export interface ISlickRange {
    fromCell: number;
    fromRow: number;
    toCell: number;
    toRow: number;
}
export interface ISlickGrid {
    getActiveCellNode(): any;
    getCanvasNode(): any;
    resetActiveCell(): void;
    focus(): void;
    getColumnIndex(columnId: string): number;
    getDataLength(): number;
}
}
declare module 'angular2-slickgrid/components/js/selectionmodel' {
export * from '~angular2-slickgrid/components/js/selectionmodel';
}

// Generated by typings
// Source: node_modules/angular2-slickgrid/components/js/slickgrid.d.ts
declare module '~angular2-slickgrid/components/js/slickgrid' {
import { OnChanges, OnInit, OnDestroy, SimpleChange, EventEmitter, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { IObservableCollection, IGridDataRow, IColumnDefinition } from '~angular2-slickgrid/components/js/interfaces';
import { ISlickRange } from '~angular2-slickgrid/components/js/selectionmodel';
export class SlickGrid implements OnChanges, OnInit, OnDestroy, AfterViewInit {
    private _el;
    private _gridSyncService;
    columnDefinitions: IColumnDefinition[];
    dataRows: IObservableCollection<IGridDataRow>;
    resized: Observable<any>;
    editableColumnIds: string[];
    highlightedCells: {
        row: number;
        column: number;
    }[];
    blurredColumns: string[];
    contextColumns: string[];
    columnsLoading: string[];
    overrideCellFn: (rowNumber, columnId, value?, data?) => string;
    showHeader: boolean;
    showDataTypeIcon: boolean;
    enableColumnReorder: boolean;
    enableAsyncPostRender: boolean;
    selectionModel: string;
    plugins: string[];
    loadFinished: EventEmitter<void>;
    cellChanged: EventEmitter<{
        column: string;
        row: number;
        newValue: any;
    }>;
    editingFinished: EventEmitter<any>;
    contextMenu: EventEmitter<{
        x: number;
        y: number;
    }>;
    topRowNumber: number;
    topRowNumberChange: EventEmitter<number>;
    onFocus(): void;
    private _grid;
    private _gridColumns;
    private _gridData;
    private _rowHeight;
    private _resizeSubscription;
    private _gridSyncSubscription;
    private _topRow;
    private _leftPx;
    private static getDataWithSchema(data, columns);
    constructor(_el: any, _gridSyncService: any);
    ngOnChanges(changes: {
        [propName: string]: SimpleChange;
    }): void;
    private invalidateRange(start, end);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    onResize(): void;
    getSelectedRanges(): ISlickRange[];
    registerPlugin(plugin: string): void;
    setActive(): void;
    selection: ISlickRange[] | boolean;
    private getColumnEditor;
    private getFormatter;
    private initGrid();
    private subscribeToScroll();
    private subscribeToCellChanged();
    private updateColumnWidths();
    subscribeToContextMenu(): void;
    private updateSchema();
    private getImagePathForDataType(type);
    private setCallbackOnDataRowsChanged();
    private renderGridDataRowsRange(startIndex, count);
}
}
declare module 'angular2-slickgrid/components/js/slickgrid' {
export * from '~angular2-slickgrid/components/js/slickgrid';
}

// Generated by typings
// Source: node_modules/angular2-slickgrid/components/js/virtualizedcollection.d.ts
declare module '~angular2-slickgrid/components/js/virtualizedcollection' {
import { IObservableCollection, CollectionChange } from '~angular2-slickgrid/components/js/interfaces';
export class VirtualizedCollection<TData> implements IObservableCollection<TData> {
    private _placeHolderGenerator;
    private _length;
    private _windowSize;
    private _bufferWindowBefore;
    private _window;
    private _bufferWindowAfter;
    private collectionChangedCallback;
    constructor(windowSize: number, length: number, loadFn: (offset: number, count: number) => Promise<TData[]>, _placeHolderGenerator: (index: number) => TData);
    setCollectionChangedCallback(callback: (change: CollectionChange, startIndex: number, count: number) => void): void;
    getLength(): number;
    at(index: number): TData;
    getRange(start: number, end: number): TData[];
    private getRangeFromCurrent(start, end);
    private getDataFromCurrent(index);
    private resetWindowsAroundIndex(index);
}
}
declare module 'angular2-slickgrid/components/js/virtualizedcollection' {
export * from '~angular2-slickgrid/components/js/virtualizedcollection';
}

// Generated by typings
// Source: node_modules/angular2-slickgrid/index.d.ts
declare module '~angular2-slickgrid/index' {
export * from '~angular2-slickgrid/components/js/gridsync.service';
export * from '~angular2-slickgrid/components/js/interfaces';
export * from '~angular2-slickgrid/components/js/selectionmodel';
export * from '~angular2-slickgrid/components/js/slickgrid';
export * from '~angular2-slickgrid/components/js/virtualizedcollection';
}
declare module 'angular2-slickgrid/index' {
export * from '~angular2-slickgrid/index';
}
declare module 'angular2-slickgrid' {
export * from '~angular2-slickgrid/index';
}
