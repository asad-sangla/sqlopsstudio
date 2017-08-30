/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TableView } from 'sql/base/browser/ui/table/tableView';
import { IProfilerSession, IProfilerService, ProfilerSessionID } from 'sql/parts/profiler/service/interfaces';
import { ProfilerState, IProfilerStateChangedEvent } from './profilerState';
import * as Utils from 'sql/parts/connection/common/utils';

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput } from 'vs/workbench/common/editor';
import { IEditorModel } from 'vs/platform/editor/common/editor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import Event, { Emitter } from 'vs/base/common/event';

import * as nls from 'vs/nls';

export class ProfilerInput extends EditorInput implements IProfilerSession {

	public static ID: string = 'workbench.editorinputs.profilerinputs';
	public static SCHEMA: string = 'profiler';
	private _data: TableView<Slick.SlickData>;
	private _id: ProfilerSessionID;
	private _state: ProfilerState;
	private _columns: string[] = [];

	private _onColumnsChanged = new Emitter<Slick.Column<Slick.SlickData>[]>();
	public onColumnsChanged: Event<Slick.Column<Slick.SlickData>[]> = this._onColumnsChanged.event;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super();
		this._state = new ProfilerState();
		// set inital state
		this.state.change({
			isConnected: false,
			isStopped: false,
			isPaused: false,
			isRunning: false,
			autoscroll: true
		});
		this._state.addChangeListener(e => this._onStateChange(e));
		this._id = this._profilerService.registerSession(Utils.generateGuid(), this);
		let searchFn = (val: { [x: string]: string }, exp: string): Array<number> => {
			let ret = new Array<number>();
			for (let i = 0; i < this._columns.length; i++) {
				if (val[this._columns[i]].includes(exp)) {
					ret.push(i);
				}
			}
			return ret;
		};
		this._data = new TableView<Slick.SlickData>(undefined, searchFn);
	}

	public getTypeId(): string {
		return ProfilerInput.ID;
	}

	public resolve(refresh?: boolean): TPromise<IEditorModel> {
		return undefined;
	}

	public getName(): string {
		return nls.localize('profiler', 'Profiler');
	}

	public get data(): TableView<Slick.SlickData> {
		return this._data;
	}

	public get columns(): Slick.Column<Slick.SlickData>[] {
		if (this._columns) {
			return this._columns.map(i => {
				return <Slick.Column<Slick.SlickData>>{
					id: i,
					field: i,
					name: i,
					sortable: true
				};
			});
		} else {
			return [];
		}
	}

	public get id(): ProfilerSessionID {
		return this._id;
	}

	public get state(): ProfilerState {
		return this._state;
	}

	public onMoreRows(rowCount: number, data: string[]) {
		let newData = {};
		for (let i = 0; i < data.length; i++) {
			newData[this._columns[i]] = data[i];
		}
		this._data.push(newData);
	}

	private _onStateChange(e: IProfilerStateChangedEvent): void {
		if (e.isConnected) {
			if (this.state.isConnected) {
				this._profilerService.getColumns(this._id).then(result => {
					this._columns = result;
					this._onColumnsChanged.fire(this.columns);
				});
			}
		}
	}
}
