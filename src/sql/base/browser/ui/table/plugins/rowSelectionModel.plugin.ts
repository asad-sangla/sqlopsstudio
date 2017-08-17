// Adopted and converted to typescript from https://github.com/6pac/SlickGrid/blob/master/plugins/slick.rowselectionmodel.js
// heavily modified
import { mixin } from 'vs/base/common/objects';

const defaultOptions: IRowSelectionModelOptions = {
	selectActiveRow: true
};

export interface IRowSelectionModelOptions extends Slick.PluginOptions {
	selectActiveRow?: boolean;
}

export class RowSelectionModel<T extends Slick.SlickData> implements Slick.SelectionModel<T, Array<Slick.Range>> {
	private _options: IRowSelectionModelOptions;
	private _grid: Slick.Grid<T>;
	private _handler = new Slick.EventHandler();
	private _ranges: Array<Slick.Range> = [];

	public onSelectedRangesChanged = new Slick.Event<Array<Slick.Range>>();

	constructor(options?: Slick.PluginOptions) {
		this._options = mixin(options, defaultOptions, false);
	}

	public init(grid: Slick.Grid<T>) {
		this._grid = grid;
		this._handler
			.subscribe(this._grid.onActiveCellChanged, (e, data) => this.handleActiveCellChange(e, data))
			.subscribe(this._grid.onKeyDown, (e) => this.handleKeyDown(e))
			.subscribe(this._grid.onClick, (e) => this.handleClick(e));
	}

	private rangesToRows(ranges) {
		var rows = [];
		for (var i = 0; i < ranges.length; i++) {
			for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
				rows.push(j);
			}
		}
		return rows;
	}

	private rowsToRanges(rows) {
		var ranges = [];
		var lastCell = this._grid.getColumns().length - 1;
		for (var i = 0; i < rows.length; i++) {
			ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
		}
		return ranges;
	}

	public getSelectedRows() {
		return this.rangesToRows(this._ranges);
	}

	public setSelectedRows(rows) {
		this.setSelectedRanges(this.rowsToRanges(rows));
	}

	public setSelectedRanges(ranges) {
		// simle check for: empty selection didn't change, prevent firing onSelectedRangesChanged
		if ((!this._ranges || this._ranges.length === 0) && (!ranges || ranges.length === 0)) { return; }
		this._ranges = ranges;
		this.onSelectedRangesChanged.notify(this._ranges);
	}

	public getSelectedRanges() {
		return this._ranges;
	}

	private getRowsRange(from, to) {
		var i, rows = [];
		for (i = from; i <= to; i++) {
			rows.push(i);
		}
		for (i = to; i < from; i++) {
			rows.push(i);
		}
		return rows;
	}

	private handleActiveCellChange(e, data) {
		if (this._options.selectActiveRow && data.row !== null) {
			this.setSelectedRanges([new Slick.Range(data.row, 0, data.row, this._grid.getColumns().length - 1)]);
		}
	}

	private handleKeyDown(e) {
		var activeRow = this._grid.getActiveCell();
		if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which === 38 || e.which === 40)) {
			var selectedRows = this.getSelectedRows();
			selectedRows.sort((x, y) => x - y );

			if (!selectedRows.length) {
				selectedRows = [activeRow.row];
			}

			var top = selectedRows[0];
			var bottom = selectedRows[selectedRows.length - 1];
			var active;

			if (e.which === 40) {
				active = activeRow.row < bottom || top === bottom ? ++bottom : ++top;
			} else {
				active = activeRow.row < bottom ? --bottom : --top;
			}

			if (active >= 0 && active < this._grid.getDataLength()) {
				this._grid.scrollRowIntoView(active, undefined);
				var tempRanges = this.rowsToRanges(this.getRowsRange(top, bottom));
				this.setSelectedRanges(tempRanges);
			}

			e.preventDefault();
			e.stopPropagation();
		}
	}

	private handleClick(e) {
		var cell = this._grid.getCellFromEvent(e);
		if (!cell || !this._grid.canCellBeActive(cell.row, cell.cell)) {
			return false;
		}

		if (!this._grid.getOptions().multiSelect || (
			!e.ctrlKey && !e.shiftKey && !e.metaKey)) {
			return false;
		}

		var selection = this.rangesToRows(this._ranges);
		var idx = $.inArray(cell.row, selection);

		if (idx === -1 && (e.ctrlKey || e.metaKey)) {
			selection.push(cell.row);
			this._grid.setActiveCell(cell.row, cell.cell);
		} else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
			selection = selection.filter(o => o !== cell.row);
			this._grid.setActiveCell(cell.row, cell.cell);
		} else if (selection.length && e.shiftKey) {
			var last = selection.pop();
			var from = Math.min(cell.row, last);
			var to = Math.max(cell.row, last);
			selection = [];
			for (var i = from; i <= to; i++) {
				if (i !== last) {
					selection.push(i);
				}
			}
			selection.push(last);
			this._grid.setActiveCell(cell.row, cell.cell);
		}

		var tempRanges = this.rowsToRanges(selection);
		this.setSelectedRanges(tempRanges);
		e.stopImmediatePropagation();

		return true;
	}

	public destroy() {
		this._handler.unsubscribeAll();
	}

}
