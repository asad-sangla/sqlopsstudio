/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import EditorCommon = require('vs/editor/common/editorCommon');
import Event, { Emitter } from 'vs/base/common/event';
import { IEditor } from 'vs/platform/editor/common/editor';
import { ICodeEditorService } from 'vs/editor/common/services/codeEditorService';
import { IModelService } from 'vs/editor/common/services/modelService';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { RunOnceScheduler } from 'vs/base/common/async';
import { IdGenerator } from 'vs/base/common/idGenerator';
import { Range } from 'vs/editor/common/core/range';
import { Selection } from 'vs/editor/common/core/selection';
import { EndOfLine, TextEditorLineNumbersStyle } from 'vs/workbench/api/node/extHostTypes';

import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers'

export class MainThreadConnectionTracker {

	private _registerServersService: IRegisteredServersService;

	private _onConnection: Emitter<void>;

	private _toDispose: IDisposable[];

	constructor(registerServersService: IRegisteredServersService) {

		this._registerServersService = registerServersService;

		this._toDispose = [];

		this._onConnection = new Emitter<void>();
		this._registerServersService.onConnectionSwitched(this._onConnectionSwitched, this, this._toDispose);
	}

	public get onConnection(): Event<void> {
		return this._onConnection.event;
	}

	private _onConnectionSwitched(): void {
		this._onConnection.fire(undefined);
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}
}
