/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ProfilerInput } from './profilerInput';

import * as DOM from 'vs/base/browser/dom';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { Dimension, Builder } from 'vs/base/browser/builder';
import { TPromise } from 'vs/base/common/winjs.base';
import { EditorOptions } from 'vs/workbench/common/editor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService';

export class ProfilerEditor extends BaseEditor {
	public static ID: string = 'workbench.editor.profiler';
	protected _input: ProfilerInput;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkbenchThemeService themeService: IWorkbenchThemeService
	) {
		super(ProfilerEditor.ID, telemetryService, themeService);
	}

	protected createEditor(parent: Builder): void {
		// no op
	}

	public get input(): ProfilerInput {
		return this._input;
	}

	public setInput(input: ProfilerInput, options?: EditorOptions): TPromise<void> {
		if (input instanceof ProfilerInput && input.matches(this.input)) {
			return TPromise.as(null);
		}

		let parent = this.getContainer();

		parent.clearChildren();

		return super.setInput(input, options).then(() => {
			if (!this.input.container) {
				let container = document.createElement('div');
				container.className = 'carbon-profiler';
				container.style.width = '100%';
				container.style.height = '100%';
				DOM.append(parent.getHTMLElement(), container);
				this.input.container = container;
			} else {
				DOM.append(parent.getHTMLElement(), this.input.container);
			}

		});
	}

	public layout(dimension: Dimension): void {
		// no op
	}

}
