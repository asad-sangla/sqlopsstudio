/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IEditorOptions } from 'vs/editor/common/config/editorOptions';
import * as nls from 'vs/nls';
import { Dimension, Builder } from 'vs/base/browser/builder';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { TPromise } from 'vs/base/common/winjs.base';
import { ResourceEditorModel } from 'vs/workbench/common/editor/resourceEditorModel';
import * as editorCommon from 'vs/editor/common/editorCommon';

import { BaseTextEditor } from 'vs/workbench/browser/parts/editor/textEditor';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { ITextResourceConfigurationService } from 'vs/editor/common/services/resourceConfiguration';
import { IModeService } from 'vs/editor/common/services/modeService';
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { EditorOptions } from 'vs/workbench/common/editor';
import { CodeEditor } from 'vs/editor/browser/codeEditor';
import { IEditorContributionCtor } from 'vs/editor/browser/editorBrowser';
import { FoldingController } from 'vs/editor/contrib/folding/browser/folding';

class ProfilerResourceCodeEditor extends CodeEditor {

	protected _getContributions(): IEditorContributionCtor[] {
		let contributions = super._getContributions();
		let skipContributions = [FoldingController.prototype];
		contributions = contributions.filter(c => skipContributions.indexOf(c.prototype) === -1);
		return contributions;
	}

}

/**
 * Extension of TextResourceEditor that is always readonly rather than only with non UntitledInputs
 */
export class ProfilerResourceEditor extends BaseTextEditor {

	public static ID = 'profiler.editors.textEditor';
	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IStorageService storageService: IStorageService,
		@ITextResourceConfigurationService configurationService: ITextResourceConfigurationService,
		@IThemeService themeService: IThemeService,
		@IModeService modeService: IModeService,
		@ITextFileService textFileService: ITextFileService,
		@IEditorGroupService editorGroupService: IEditorGroupService

	) {
		super(ProfilerResourceEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, modeService, textFileService, editorGroupService);
	}

	public createEditorControl(parent: Builder, configuration: IEditorOptions): editorCommon.IEditor {
		return this.instantiationService.createInstance(ProfilerResourceCodeEditor, parent.getHTMLElement(), configuration);
	}

	protected getConfigurationOverrides(): IEditorOptions {
		const options = super.getConfigurationOverrides();
		options.readOnly = true;
		if (this.input) {
			options.inDiffEditor = true;
			options.scrollBeyondLastLine = false;
			options.folding = false;
			options.renderWhitespace = 'none';
			options.wordWrap = 'on';
			options.renderIndentGuides = false;
			options.rulers = [];
			options.glyphMargin = true;
			options.minimap = {
				enabled: false
			};
		}
		return options;
	}

	setInput(input: UntitledEditorInput, options: EditorOptions): TPromise<void> {
		return super.setInput(input, options)
			.then(() => this.input.resolve()
				.then(editorModel => editorModel.load())
				.then(editorModel => this.getControl().setModel((<ResourceEditorModel>editorModel).textEditorModel)));
	}

	protected getAriaLabel(): string {
		return nls.localize('profilerTextEditorAriaLabel', 'Profiler editor for event text. Readonly');
	}

	public layout(dimension: Dimension) {
		this.getControl().layout(dimension);
	}
}
