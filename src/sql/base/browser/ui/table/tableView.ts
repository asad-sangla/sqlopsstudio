/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import Event, { Emitter } from 'vs/base/common/event';
import { TPromise } from 'vs/base/common/winjs.base';

export interface IFindPosition {
	x: number;
	y: number;
}

export class TableView<T extends Slick.SlickData> implements Slick.DataProvider<T> {
	private _data: Array<T>;
	private _findArray: Array<IFindPosition>;
	private _findObs: Observable<IFindPosition>;
	private _findIndex: number;

	private _onRowCountChange = new Emitter<number>();
	get onRowCountChange(): Event<number> { return this._onRowCountChange.event; }

	private _onFindCountChange = new Emitter<number>();
	get onFindCountChange(): Event<number> { return this._onFindCountChange.event; }

	constructor(data?: Array<T>, private _findFn?: (val: T, exp: string) => Array<number>) {
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

	push(items: Array<T>);
	push(item: T);
	push(input: T | Array<T>) {
		if (Array.isArray(input)) {
			this._data.push(...input);
		} else {
			this._data.push(input);
		}
		this._onRowCountChange.fire();
	}

	clear() {
		this._data = new Array<T>();
		this._onRowCountChange.fire();
	}

	find(exp: string): Thenable<IFindPosition> {
		if (!this._findFn) {
			return TPromise.wrapError(new Error('no find function provided'));
		}
		this._findArray = new Array<IFindPosition>();
		this._findIndex = 0;
		this._onFindCountChange.fire(this._findArray.length);
		if (exp) {
			this._findObs = Observable.create((observer: Observer<IFindPosition>) => {
				this._data.forEach((item, i) => {
					let result = this._findFn(item, exp);
					if (result) {
						result.forEach(pos => {
							let index = { x: pos, y: i };
							this._findArray.push(index);
							observer.next(index);
							this._onFindCountChange.fire(this._findArray.length);
						});
					}
				});
			});
			return this._findObs.take(1).toPromise().then(() => {
				return this._findArray[this._findIndex];
			});
		} else {
			return TPromise.wrapError(new Error('no expression'));
		}
	}

	clearFind() {
		this._findArray = new Array<IFindPosition>();
		this._findIndex = 0;
		this._findObs = undefined;
		this._onFindCountChange.fire(this._findArray.length);
	}

	findNext(): Thenable<IFindPosition> {
		if (this._findArray && this._findArray.length !== 0) {
			if (this._findIndex === this._findArray.length - 1) {
				this._findIndex = 0;
			} else {
				++this._findIndex;
			}
				return TPromise.as(this._findArray[this._findIndex]);
		} else {
			return TPromise.wrapError(new Error('no search running'));
		}
	}

	findPrevious(): Thenable<IFindPosition> {
		if (this._findArray && this._findArray.length !== 0) {
			if (this._findIndex === 0) {
				this._findIndex = this._findArray.length - 1;
			} else {
				--this._findIndex;
			}
			return TPromise.as(this._findArray[this._findIndex]);
		} else {
			return TPromise.wrapError(new Error('no search running'));
		}
	}

	/* 1 indexed */
	get findPosition(): number {
		return this._findIndex + 1;
	}

	get findCount(): number {
		return this._findArray.length;
	}
}
