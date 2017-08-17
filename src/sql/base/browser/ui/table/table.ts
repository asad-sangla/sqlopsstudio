/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./table';
import { TableView } from './tableView';

import { IThemable } from 'vs/platform/theme/common/styler';
import { IListStyles } from 'vs/base/browser/ui/list/listWidget';
import * as DOM from 'vs/base/browser/dom';
import { Color } from 'vs/base/common/color';

export interface ITableStyles extends IListStyles {
	tableHeaderBackground?: Color;
	tableHeaderForeground?: Color;
}

export class Table<T extends Slick.SlickData> implements IThemable {
	private _grid: Slick.Grid<T>;
	private _columns: Slick.Column<T>[];
	private _data: TableView<T>;
	private _styleElement: HTMLStyleElement;
	private _idPrefix: string;

	constructor(container: HTMLElement, data?: Array<T> | TableView<T>, columns?: Slick.Column<T>[], options?: Slick.GridOptions<T>) {
		if (data instanceof TableView) {
			this._data = data;
		} else {
			this._data = new TableView<T>(data);
		}

		if (columns) {
			this._columns = columns;
		} else {
			this._columns = new Array<Slick.Column<T>>();
		}

		let body = document.createElement('div');
		body.className = 'monaco-table';
		container.appendChild(body);
		this._styleElement = DOM.createStyleSheet(body);
		let gridElement = document.createElement('div');
		gridElement.style.width = '100%';
		gridElement.style.height = '100%';
		body.appendChild(gridElement);
		this._styleElement = DOM.createStyleSheet(body);
		this._grid = new Slick.Grid(gridElement, this._data, this._columns, options || {});
		this._idPrefix = gridElement.classList[0];
		this._data.onRowCountChange(() => {
			this._grid.updateRowCount();
			this._grid.render();
		});
	}

	set columns(columns: Slick.Column<T>[]) {
		this._columns = columns;
		this._grid.setColumns(columns);
		this._grid.autosizeColumns();
	}

	setSelectionModel(model: Slick.SelectionModel<T, Array<Slick.Range>>) {
		this._grid.setSelectionModel(model);
	}

	registerPlugin(plugin: Slick.Plugin<T>) {
		this._grid.registerPlugin(plugin);
	}

	style(styles: ITableStyles): void {
		const content: string[] = [];

		if (styles.tableHeaderBackground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-header .slick-header-column { background-color: ${styles.tableHeaderBackground}; }`);
		}

		if (styles.tableHeaderForeground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-header .slick-header-column { color: ${styles.tableHeaderForeground}; }`);
		}

		if (styles.listFocusBackground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .focused { background-color: ${styles.listFocusBackground}; }`);
		}

		if (styles.listFocusForeground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .focused { color: ${styles.listFocusForeground}; }`);
		}

		if (styles.listActiveSelectionBackground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .selected { background-color: ${styles.listActiveSelectionBackground}; }`);
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
		}

		if (styles.listActiveSelectionForeground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .selected { color: ${styles.listActiveSelectionForeground}; }`);
		}

		if (styles.listFocusAndSelectionBackground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }`);
		}

		if (styles.listFocusAndSelectionForeground) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row .selected.focused { color: ${styles.listFocusAndSelectionForeground}; }`);
		}

		if (styles.listInactiveFocusBackground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
			content.push(`.monaco-table .${this._idPrefix} .slick-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
		}

		if (styles.listInactiveSelectionBackground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row .selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
			content.push(`.monaco-table .${this._idPrefix} .slick-row .selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
		}

		if (styles.listInactiveSelectionForeground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row .selected { color: ${styles.listInactiveSelectionForeground}; }`);
		}

		if (styles.listHoverBackground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row:hover { background-color:  ${styles.listHoverBackground}; }`);
		}

		if (styles.listHoverForeground) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row:hover { color:  ${styles.listHoverForeground}; }`);
		}

		if (styles.listSelectionOutline) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row .selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
		}

		if (styles.listFocusOutline) {
			content.push(`.monaco-table .${this._idPrefix}:focus .slick-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }`);
		}

		if (styles.listInactiveFocusOutline) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
		}

		if (styles.listHoverOutline) {
			content.push(`.monaco-table .${this._idPrefix} .slick-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
		}

		this._styleElement.innerHTML = content.join('\n');
	}
}
