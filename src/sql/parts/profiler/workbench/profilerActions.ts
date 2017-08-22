/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ProfilerSessionID, IProfilerService } from 'sql/parts/profiler/service/interfaces';
import { IProfilerController } from 'sql/parts/profiler/controller/interfaces';

import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';
import { IEditorAction } from 'vs/editor/common/editorCommon';

export interface IProfilerActionContext {
	id: ProfilerSessionID;
}

export class ProfilerConnect extends Action {
	public static ID = 'profiler.connect';
	public static LABEL = nls.localize('connect', "Connect");

	private _connected: boolean = false;

	constructor(
		id: string, label: string,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon connectDatabase');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		if (!this._connected) {
			this.enabled = false;
			return new TPromise<boolean>((resolve, reject) => {
				this._profilerService.connectSession(context.id).then(() => {
					this._setClass('queryTaskbarIcon disconnectDatabase');
					this._setLabel('Disconnect');
					this._connected = true;
					this.enabled = true;
					resolve(true);
				});
			});
		} else {
			this.enabled = false;
			return new TPromise<boolean>((resolve, reject) => {
				this._profilerService.connectSession(context.id).then(() => {
					this._setClass('queryTaskbarIcon connectDatabase');
					this._setLabel('Connect');
					this._connected = false;
					this.enabled = true;
					resolve(true);
				});
			});
		}
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
		return TPromise.wrap(this._profilerService.startSession(context.id).then(() => true));
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
		return TPromise.wrap(this._profilerService.pauseSession(context.id).then(() => true));
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
		return TPromise.wrap(this._profilerService.stopSession(context.id).then(() => true));
	}
}

export class ProfilerShowFind extends Action {
	public static ID = 'profiler.findString';
	public static LABEL = nls.localize('findString', 'Find String');

	constructor(
		id: string, label: string, private profiler: IProfilerController,
		@IProfilerService private _profilerService: IProfilerService
	) {
		super(id, label, 'queryTaskbarIcon cancelQuery');
	}

	public run(context: IProfilerActionContext): TPromise<boolean> {
		this.profiler.toggleFind();
		return TPromise.as(true);
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
