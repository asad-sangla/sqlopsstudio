/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//import { Component } from '@angular/core';

//import 'vs/css!./css/color-theme-dark';
//import 'vs/css!./css/color-theme-light';
//import 'vs/css!./css/flexbox';
//import 'vs/css!./css/styles';


import { IGridIcon, FieldType, IColumnDefinition, IGridDataSet, IDbColumn } from './gridInterfaces';
import { IObservableCollection, IGridDataRow, ISlickRange, SlickGrid, VirtualizedCollection } from 'angular2-slickgrid';
import * as Utils from './utils';

declare let AngularCore;
AngularCore.enableProdMode();

const template = `
<h1>The slickgrid componenet loaded</h1>
<div class="fullsize vertBox">
    <div id="results" *ngIf="renderedDataSets.length > 0" class="results vertBox scrollable">
        <div class="boxRow content horzBox slickgrid" *ngFor="let dataSet of renderedDataSets; let i = index"
          [style.max-height]="dataSet.maxHeight" [style.min-height]="dataSet.minHeight">

            <slick-grid #slickgrid id="slickgrid_{{i}}" [columnDefinitions]="dataSet.columnDefinitions"
                        [ngClass]="i === activeGrid ? 'active' : ''"
                        [dataRows]="dataSet.dataRows"
                        enableAsyncPostRender="true"
                        showDataTypeIcon="false"
                        showHeader="true"
                        class="boxCol content vertBox slickgrid">
            </slick-grid>

        </div>
    </div>
</div>
`;

@AngularCore.Component({
  selector: 'slickgrid-container',
  template: template
})

export class AppComponent {

    private activeGrid = 0;
    private _defaultNumShowingRows = 8;
    private _rowHeight = 29;
    private windowSize = 50;

    private dataSets: IGridDataSet[] = [];
    private placeHolderDataSets: IGridDataSet[] = [];
    private renderedDataSets: IGridDataSet[] = this.placeHolderDataSets;

    private dataIcons: IGridIcon[] =
    [
      {
          showCondition: undefined,
          icon: undefined,
          hoverText: undefined,
          functionality: undefined
      },
      {
          showCondition: undefined,
          icon: undefined,
          hoverText: undefined,
          functionality: undefined
      },
      {
          showCondition: undefined,
          icon: undefined,
          hoverText: undefined,
          functionality: undefined
      }
    ];

    //@AngularCore.ViewChildren('slickgrid') slickgrids: QueryList<SlickGrid>;
    @AngularCore.ViewChildren('slickgrid') slickgrids: any;

    constructor() {}

    /**
     * Called by Angular when the object is initialized
     */
    ngOnInit(): void {
      this.createDataSet();
    }

    createDataSet(): void {
      const self = this;

      let rowCount = 10;
      let colDefs = [
        this.getTestColumn('col1'),
        this.getTestColumn('col2'),
        this.getTestColumn('col3')
      ];
      let resultSet = {
        batchId: 0,
        id: 0,
        rowCount: rowCount,
        columnInfo: colDefs
      };

      // Setup a function for generating a promise to lookup result subsets
      let loadDataFunction = (offset: number, count: number) : Promise<IGridDataRow[]> => {
        return new Promise<IGridDataRow[]>((resolve, reject) => {
          let gridData: IGridDataRow[] = [];
          for(let r = 0; r < rowCount; r++) {

            let rowData: IGridDataRow = { values: [] };
            for(let c = 0; c < colDefs.length; c++) {
              let val = 'row: ' + r + ', col: ' + c;
              rowData.values.push(val);
            }

            gridData.push(rowData);
            resolve(gridData);
          }
        });
      };

      // Precalculate the max height and min height
      let maxHeight = resultSet.rowCount < self._defaultNumShowingRows
          ? Math.max((resultSet.rowCount + 1) * self._rowHeight, self.dataIcons.length * 30) + 10
          : 'inherit';
      let minHeight = resultSet.rowCount > self._defaultNumShowingRows
          ? (self._defaultNumShowingRows + 1) * self._rowHeight + 10
          : maxHeight;

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
            return {
                id: i.toString(),
                name: c.columnName === 'Microsoft SQL Server 2005 XML Showplan'
                    ? 'XML Showplan'
                    : c.columnName,
                type: self.stringToFieldType('string'),
                formatter: self.textFormatter,
                asyncPostRender: undefined
            };
        })
      };

      self.dataSets.push(dataSet);
      self.renderedDataSets = self.dataSets;
    }

    private getTestColumn(colName: string): IDbColumn {
      return {
        baseCatalogName: null,
        baseColumnName: null,
        baseSchemaName: null,
        baseServerName: null,
        baseTableName: null,
        columnName: colName,
        udtAssemblyQualifiedName: null,
        dataType: 'System.String, System.Private.CoreLib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e',
        dataTypeName: 'nvarchar'
      };
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

    /**
     * Format xml field into a hyperlink and performs HTML entity encoding
     */
    public hyperLinkFormatter(row: number, cell: any, value: string, columnDef: any, dataContext: any): string {
        let valueToDisplay = value;
        let cellClasses = 'grid-cell-value-container';
        if (value) {
            cellClasses += ' xmlLink';
            valueToDisplay = Utils.htmlEntities(value);
            return `<a class="${cellClasses}" href="#" >${valueToDisplay}</a>`;
        } else {
            cellClasses += ' missing-value';
            return `<span title="${valueToDisplay}" class="${cellClasses}">${valueToDisplay}</span>`;
        }
    }


    /**
     * Format all text to replace all new lines with spaces and performs HTML entity encoding
     */
    textFormatter(row: number, cell: any, value: string, columnDef: any, dataContext: any): string {
        let valueToDisplay = value;
        let cellClasses = 'grid-cell-value-container';
        if (value) {
            valueToDisplay = Utils.htmlEntities(value.replace(/(\r\n|\n|\r)/g, ' '));
        } else {
            cellClasses += ' missing-value';
        }

        return `<span title="${valueToDisplay}" class="${cellClasses}">${valueToDisplay}</span>`;
    }

    /**
     * Return asyncPostRender handler based on type
     */
    public linkHandler(type: string): Function {
        if (type === 'xml') {
            return this.xmlLinkHandler;
        } else if (type === 'json') {
            return this.jsonLinkHandler;
        }
    }

    /**
     * Add handler for clicking on xml link
     */
    xmlLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
      // TODO
    }


    /**
     * Add handler for clicking on json link
     */
    jsonLinkHandler = (cellRef: string, row: number, dataContext: JSON, colDef: any) => {
      // TODO
    }
}