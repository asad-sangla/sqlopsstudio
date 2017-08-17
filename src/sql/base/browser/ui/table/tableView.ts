/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import Event, { Emitter } from 'vs/base/common/event';

export class TableView<T extends Slick.SlickData> implements Slick.DataProvider<T> {
	private _data: Array<T>;

	private _onRowCountChange = new Emitter<number>();
	get onRowCountChange(): Event<number> { return this._onRowCountChange.event; }

	constructor(data?: Array<T>) {
		if (data) {
			this._data = data;
		} else {
			this._data = new Array<T>();
		}
	}

	getLength(): number {
		return this._data.length;
	}

	getItem(index: number): T {
		return this._data[index];
	}

	push(item: T) {
		this._data.push(item);
		this._onRowCountChange.fire();
	}

	clear() {
		this._data = new Array<T>();
		this._onRowCountChange.fire();
	}
}
