/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ProfilerSessionID, IProfilerService } from 'sql/parts/profiler/service/interfaces';
import { IProfilerController } from 'sql/parts/profiler/controller/interfaces';
import { ProfilerState } from 'sql/parts/profiler/profilerState';
import { TableView } from 'sql/base/browser/ui/table/tableView';

import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';
import { IEditorAction } from 'vs/editor/common/editorCommon';

export interface IProfilerActionContext {
	id: ProfilerSessionID;
	state: ProfilerState;
	data: TableView<Slick.SlickData>;
}

export class ProfilerConnect extends Action {
	public static ID = 'profiler.connect';
	public static LABEL = nls.localize('connect', 'Connect');

	private _connected: boolean = false;

	constructor(
		id: string, label: string,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon connectDatabase');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.enabled = false;
		if (!this._connected) {
			return TPromise.wrap(this._profilerService.connectSession(context.id).then(() => {
				this.enabled = true;
				this.connected = true;
				context.state.change({ isConnected: true, isRunning: false, isPaused: false, isStopped: true });
				return true;
			}));
		} else {
			return TPromise.wrap(this._profilerService.disconnectSession(context.id).then(() => {
				this.enabled = true;
				this.connected = false;
				context.state.change({ isConnected: false, isRunning: false, isPaused: false, isStopped: false });
				return true;
			}));
		}
	}

	public set connected(value: boolean) {
		this._connected = value;
		this._setClass('queryTaskbarIcon ' + (value ? 'disconnectDatabase' : 'connectDatabase'));
		this._setLabel(value ? nls.localize('disconnect', 'Disconnected') : nls.localize('connect', 'Connect'));
	}

	public get connected(): boolean {
		return this._connected;
	}
}

export class ProfilerStart extends Action {
	public static ID = 'profiler.start';
	public static LABEL = nls.localize('start', "Start");

	constructor(
		id: string, label: string,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon runQuery');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.enabled = false;
		return TPromise.wrap(this._profilerService.startSession(context.id).then(() => {
			context.state.change({ isRunning: true, isStopped: false, isPaused: false });
			return true;
		}));
	}

}

export class ProfilerPause extends Action {
	public static ID = 'profiler.pause';
	public static LABEL = nls.localize('pause', "Pause");

	constructor(
		id: string, label: string,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.enabled = false;
		return TPromise.wrap(this._profilerService.pauseSession(context.id).then(() => {
			context.state.change({ isPaused: true, isStopped: false, isRunning: false });
			return true;
		}));
	}
}

export class ProfilerStop extends Action {
	public static ID = 'profiler.stop';
	public static LABEL = nls.localize('stop', "Stop");

	constructor(
		id: string, label: string,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.enabled = false;
		return TPromise.wrap(this._profilerService.stopSession(context.id).then(() => {
			context.state.change({ isStopped: true, isPaused: false, isRunning: false });
			return true;
		}));
	}
}

export class ProfilerShowFind extends Action {
	public static ID = 'profiler.findString';
	public static LABEL = nls.localize('findString', 'Find String');

	constructor(
		id: string, label: string, private profiler: IProfilerController
	) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		// this.profiler.toggleFind();
		return TPromise.as(true);
	}
}

export class ProfilerClear extends Action {
	public static ID = 'profiler.clear';
	public static LABEL = nls.localize('clear', 'Clear Data');

	constructor(id: string, label: string) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	run(context: IProfilerActionContext): TPromise<void> {
		context.data.clear();
		return TPromise.as(null);
	}
}

export class ProfilerAutoScroll extends Action {
	public static ID = 'profiler.autoscroll';
	public static LABEL = nls.localize('toggleAutoscroll', 'Toggle Auto Scroll');

	constructor(id: string, label: string) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	run(context: IProfilerActionContext): TPromise<boolean> {
		this.checked = !this.checked;
		context.state.change({ autoscroll: this.checked });
		return TPromise.as(true);
	}
}

export class ProfilerCollapsablePanelAction extends Action {
	public static ID = 'profiler.toggleCollapsePanel';
	public static LABEL = nls.localize('toggleCollapsePanel', 'Toggle Collapsed Panel');

	private _collapsed: boolean;

	constructor(id: string, label: string) {
		super(id, label, 'minimize-panel-action');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.collapsed = !this._collapsed;
		context.state.change({ isPanelCollapsed: this._collapsed });
		return TPromise.as(true);
	}

	set collapsed(val: boolean) {
		this._collapsed = val === false ? false : true;
		this._setClass(this._collapsed ? 'maximize-panel-action' : 'minimize-panel-action');
	}
}

export class ProfilerFindNext implements IEditorAction {
	public readonly id = 'profiler.findNext';
	public readonly label = nls.localize('findNext', 'Find Next String');
	public readonly alias = '';

	constructor(private profiler: IProfilerController) { }

	run(): TPromise<void> {
		this.profiler.findNext();
		return TPromise.as(null);
	}

	isSupported(): boolean {
		return true;
	}
}

export class ProfilerFindPrevious implements IEditorAction {
	public readonly id = 'profiler.findPrevious';
	public readonly label = nls.localize('findPrevious', 'Find Previous String');
	public readonly alias = '';

	constructor(private profiler: IProfilerController) { }

	run(): TPromise<void> {
		this.profiler.findPrevious();
		return TPromise.as(null);
	}

	isSupported(): boolean {
		return true;
	}
}