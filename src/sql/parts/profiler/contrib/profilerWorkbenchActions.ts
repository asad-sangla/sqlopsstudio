/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { ProfilerInput } from 'sql/parts/profiler/profilerInput';

import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import * as nls from 'vs/nls';

import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

export class GlobalNewProfilerAction extends Action {
	public static ID = 'explorer.newProfiler';
	public static LABEL = nls.localize('newProfiler', "New Profiler");

	constructor(
		id: string, label: string,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super(id, label);
	}

	run(): TPromise<boolean> {
		let profilerInput = this._instantiationService.createInstance(ProfilerInput);
		return this._editorService.openEditor(profilerInput, { pinned: true }, false).then(() => {
			return TPromise.as(true);
		});
	}
}
