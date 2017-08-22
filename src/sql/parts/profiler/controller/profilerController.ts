/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryTaskbar';

import { QueryTaskbar } from 'sql/parts/query/editor/queryTaskbar';
import { ProfilerStart, ProfilerConnect, ProfilerPause, ProfilerStop, ProfilerShowFind, ProfilerFindNext,
	ProfilerFindPrevious, IProfilerActionContext } from 'sql/parts/profiler/workbench/profilerActions';
import { IProfilerSession, IProfilerService, ProfilerSessionID } from 'sql/parts/profiler/service/interfaces';
import { TableView } from 'sql/base/browser/ui/table/tableView';
import { Table } from 'sql/base/browser/ui/table/table';
import { RowSelectionModel } from 'sql/base/browser/ui/table/plugins/rowSelectionModel.plugin';
import * as Utils from 'sql/parts/connection/common/utils';
import { IProfilerController } from 'sql/parts/profiler/controller/interfaces';
import { ProfilerFindWidget, ITableController, ACTION_IDS } from './profilerFindWidget';

import { IContextMenuService, IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { Action } from 'vs/base/common/actions';
import * as Events from 'vs/base/common/events';
import { IDisposable } from 'vs/base/common/lifecycle';
import { attachTableStyler } from 'sql/common/theme/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as dom from 'vs/base/browser/dom';
import { IOverlayWidget } from 'vs/editor/browser/editorBrowser';
import { FindReplaceState } from 'vs/editor/contrib/find/common/findState';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IEditorAction } from 'vs/editor/common/editorCommon';

import { ProfilerTestBackend } from 'sql/parts/profiler/profilerTestBackend';

export class ProfilerController implements IProfilerSession, IProfilerController, IDisposable, ITableController {
	private _id: ProfilerSessionID;

	private _taskBar: HTMLElement;
	private _profilerBody: HTMLElement;
	private _overlay: HTMLElement;
	private _actionBar: QueryTaskbar;
	private _startAction: ProfilerStart;
	private _stopAction: ProfilerStop;
	private _pauseAction: ProfilerPause;
	private _connectAction: ProfilerConnect;
	private _showFindAction: ProfilerShowFind;
	private _profilerFinder: ProfilerFindWidget;
	private _state: FindReplaceState;

	private _actionMap: {[x: string]: IEditorAction} = {};

	private _disposables: Array<IDisposable> = [];

	private _table: Table<Slick.SlickData>;

	private _columns: string[];

	private _data: TableView<Slick.SlickData>;

	constructor(
		private _container: HTMLElement,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IContextViewService private _contextViewService: IContextViewService,
		@IProfilerService profilerService: IProfilerService,
		@IThemeService private _themeService: IThemeService,
		@IKeybindingService private _keybindingService: IKeybindingService,
		@IContextKeyService private _contextKeyService: IContextKeyService
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
						this._columns = result;
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
					this._columns = [];
					this._table.columns = [];
					this._data.clear();
				}
			} else if (e.action instanceof ProfilerStart) {
				this._pauseAction.enabled = true;
				this._stopAction.enabled = true;
				this._showFindAction.enabled = true;
			} else if (e.action instanceof ProfilerPause) {
				this._startAction.enabled = true;
				this._stopAction.enabled = true;
			} else if (e.action instanceof ProfilerStop) {
				this._startAction.enabled = true;
				this._pauseAction.enabled = false;
				this._showFindAction.enabled = false;
				this._data.clear();
			}
		});

		this._taskBar = taskBar;

		let body = document.createElement('div');
		body.className = 'profiler-body monaco-editor';
		body.style.width = '100%';
		body.style.overflow = 'hidden';
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
		this._showFindAction = this._instantiationService.createInstance(ProfilerShowFind, ProfilerShowFind.ID, ProfilerShowFind.LABEL, this);
		this._actionMap[ACTION_IDS.FIND_NEXT] = this._instantiationService.createInstance(ProfilerFindNext, this);
		this._actionMap[ACTION_IDS.FIND_PREVIOUS] = this._instantiationService.createInstance(ProfilerFindPrevious, this);

		this._actionBar.setContent([
			{ action: this._startAction },
			{ action: this._pauseAction },
			{ action: this._stopAction },
			{ action: this._connectAction },
			{ element: QueryTaskbar.createTaskbarSeparator() },
			{ action: this._showFindAction }
		]);

		body.style.height = `calc(100% - ${dom.getTotalHeight(this._taskBar).toString()}px)`;

		let searchFn = (val: {[x: string]: string}, exp: string): Array<number> => {
			let ret = new Array<number>();
			for (let i = 0; i < this._columns.length; i++) {
				if (val[this._columns[i]].includes(exp)) {
					ret.push(i);
				}
			}
			return ret;
		};

		this._overlay = document.createElement('div');
		this._overlay.className = 'overlayWidgets';
		this._overlay.style.width = '100%';
		this._overlay.style.zIndex = '4';
		this._profilerBody.appendChild(this._overlay);

		this._data = new TableView<Slick.SlickData>(undefined, searchFn);
		this._table = new Table<Slick.SlickData>(body, this._data);
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
			newData[this._columns[i]] = data[i];
		}
		this._data.push(newData);
	}

	public dispose() {
		this._disposables.forEach(item => item.dispose());
	}

	public toggleFind(): void {
		if (!this._profilerFinder) {
			this._state = new FindReplaceState();
			this._profilerFinder = new ProfilerFindWidget(
				this,
				this._state,
				this._contextViewService,
				this._keybindingService,
				this._contextKeyService,
				this._themeService);

			this._data.onFindCountChange(c => this._state.changeMatchInfo(this._data.findPosition, c, undefined));

			this._state.addChangeListener(e => {
				if (e.searchString) {
					if (this._state.searchString) {
						this._data.find(this._state.searchString).then(p => {
							this._table.setActiveCell(p.y, p.x);
							this._state.changeMatchInfo(this._data.findPosition, this._data.findCount, undefined);
						});
					} else {
						this._data.clearFind();
					}
				}
				if (e.isRevealed) {
					if (this._state.isRevealed) {
						this._profilerFinder.getDomNode().style.top = '0px';
					} else {
						this._profilerFinder.getDomNode().style.top = '';
					}
				}
			});

			this._state.change({ isRevealed: true }, false);
			this._profilerFinder.focusFindInput();
		} else {
			if (this._state.isRevealed) {
				this._state.change({ isRevealed: false }, false);
				this.focus();
			} else {
				this._state.change({ isRevealed: true }, false);
				this._profilerFinder.focusFindInput();
			}
		}
	}

	public findNext() {
		this._data.findNext().then(p => {
			this._table.setActiveCell(p.y, p.x);
			this._state.changeMatchInfo(this._data.findPosition, this._data.findCount, undefined);
		});
	}

	public findPrevious() {
		this._data.findPrevious().then(p => {
			this._table.setActiveCell(p.y, p.x);
			this._state.changeMatchInfo(this._data.findPosition, this._data.findCount, undefined);
		});
	}

	public focus(): void {
		this._table.focus();
	}

	public getConfiguration() {
		return {
			layoutInfo: {
				width: dom.getTotalWidth(this.container)
			}
		};
	}

	public layoutOverlayWidget(widget: IOverlayWidget): void {
		// no op
	}

	public addOverlayWidget(widget: IOverlayWidget): void {
		let domNode = widget.getDomNode();
		domNode.style.top = '0px';
		domNode.style.right = '28px';
		this._overlay.appendChild(widget.getDomNode());
	}

	public getAction(id: string): IEditorAction {
		return this._actionMap[id];
	}
}
