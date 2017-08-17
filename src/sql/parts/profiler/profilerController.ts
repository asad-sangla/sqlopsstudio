/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryTaskbar';

import { QueryTaskbar } from 'sql/parts/query/editor/queryTaskbar';
import { ProfilerStart, ProfilerConnect, ProfilerPause, ProfilerStop, IProfilerActionContext } from './profilerActions';
import { IProfilerSession, IProfilerService, ProfilerSessionID } from './service/interfaces';
import { TableView } from 'sql/base/browser/ui/table/tableView';
import { Table } from 'sql/base/browser/ui/table/table';
import { RowSelectionModel } from 'sql/base/browser/ui/table/plugins/rowSelectionModel.plugin';
import * as Utils from 'sql/parts/connection/common/utils';

import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { Action } from 'vs/base/common/actions';
import * as Events from 'vs/base/common/events';
import { IDisposable } from 'vs/base/common/lifecycle';
import { attachTableStyler } from 'sql/common/theme/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as DOM from 'vs/base/browser/dom';

import { ProfilerTestBackend } from './profilerTestBackend';

export class ProfilerController implements IProfilerSession, IDisposable {
	private _id: ProfilerSessionID;

	private _taskBar: HTMLElement;
	private _profilerBody: HTMLElement;
	private _actionBar: QueryTaskbar;
	private _startAction: ProfilerStart;
	private _stopAction: ProfilerStop;
	private _pauseAction: ProfilerPause;
	private _connectAction: ProfilerConnect;

	private _disposables: Array<IDisposable> = [];

	private _table: Table<Slick.SlickData>;

	private columns: string[];

	private data: TableView<Slick.SlickData>;

	constructor(
		private _container: HTMLElement,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IProfilerService profilerService: IProfilerService,
		@IThemeService private _themeService: IThemeService,
	) {
		profilerService.registerProvider('default', this._instantiationService.createInstance(ProfilerTestBackend));
		this._id = profilerService.registerSession(Utils.generateGuid(), this);
		let taskBar = document.createElement('div');
		taskBar.className = 'profiler-taskbar queryTaskbar';

		this._actionBar = new QueryTaskbar(taskBar, contextMenuService);
		let context: IProfilerActionContext = { id: this._id };
		this._actionBar.context = context;

		this._actionBar.actionRunner.addListener(Events.EventType.RUN, (e: { action: Action }) => {
			if (e.action instanceof ProfilerConnect) {
				this._startAction.enabled = e.action.connected;
				this._pauseAction.enabled = false;
				this._stopAction.enabled = false;

				if(e.action.connected) {
					profilerService.getColumns(this._id).then(result => {
						this.columns = result;
						let columns = result.map(item => {
							return {
								id: item,
								name: item,
								field: item
							};
						});
						this._table.columns = columns;
					});
				} else {
					this.columns = [];
					this._table.columns = [];
					this.data.clear();
				}
			} else if (e.action instanceof ProfilerStart) {
				this._pauseAction.enabled = true;
				this._stopAction.enabled = true;
			} else if (e.action instanceof ProfilerPause) {
				this._startAction.enabled = true;
				this._stopAction.enabled = true;
			} else if (e.action instanceof ProfilerStop) {
				this._startAction.enabled = true;
				this._pauseAction.enabled = false;
				this.data.clear();
			}
		});

		this._taskBar = taskBar;

		let body = document.createElement('div');
		body.className = 'profiler-body';
		body.style.width = '100%';
		this._profilerBody = body;
		this._container.appendChild(this._taskBar);
		this._container.appendChild(this._profilerBody);

		this._startAction = this._instantiationService.createInstance(ProfilerStart, ProfilerStart.ID, ProfilerStart.LABEL);
		this._startAction.enabled = false;
		this._stopAction = this._instantiationService.createInstance(ProfilerStop, ProfilerStop.ID, ProfilerStop.LABEL);
		this._stopAction.enabled = false;
		this._pauseAction = this._instantiationService.createInstance(ProfilerPause, ProfilerPause.ID, ProfilerPause.LABEL);
		this._pauseAction.enabled = false;
		this._connectAction = this._instantiationService.createInstance(ProfilerConnect, ProfilerConnect.ID, ProfilerConnect.LABEL);

		this._actionBar.setContent([
			{ action: this._startAction },
			{ action: this._pauseAction },
			{ action: this._stopAction },
			{ action: this._connectAction }
		]);

		body.style.height = `calc(100% - ${DOM.getTotalHeight(this._taskBar).toString()}px)`;

		this.data = new TableView<Slick.SlickData>();
		this._table = new Table<Slick.SlickData>(body, this.data);
		this._table.setSelectionModel(new RowSelectionModel());
		this._disposables.push(attachTableStyler(this._table, this._themeService));
	}

	public set container(container: HTMLElement) {
		this._container = container;
		this._taskBar.remove();
		this._profilerBody.remove();
		this._container.appendChild(this._taskBar);
		this._container.appendChild(this._profilerBody);
	}

	public get container(): HTMLElement {
		return this._container;
	}

	public onMoreRows(rowCount: number, data: Array<string>) {
		let newData = {};
		for (let i = 0; i < data.length; i++) {
			newData[this.columns[i]] = data[i];
		}
		this.data.push(newData);
	}

	dispose() {
		this._disposables.forEach(item => item.dispose());
	}
}
