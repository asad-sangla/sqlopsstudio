/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ProfilerController } from './profilerController';

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput } from 'vs/workbench/common/editor';
import { IEditorModel } from 'vs/platform/editor/common/editor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import * as nls from 'vs/nls';

export class ProfilerInput extends EditorInput {

	public static ID: string = 'workbench.editorinputs.profilerinputs';
	public static SCHEMA: string = 'profiler';
	private _profilerController: ProfilerController;

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		super();
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

	public set container(container: HTMLElement) {
		if (this._profilerController) {
			this._profilerController.container = container;
		} else {
			this._profilerController = this._instantiationService.createInstance(ProfilerController, container);
		}
	}

	public get container(): HTMLElement {
		if (this._profilerController) {
			return this._profilerController.container;
		} else {
			return undefined;
		}
	}
}
