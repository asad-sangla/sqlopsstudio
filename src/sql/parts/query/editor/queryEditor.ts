/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/textdiffeditor';
import { TPromise } from 'vs/base/common/winjs.base';
import nls = require('vs/nls');
import { Builder } from 'vs/base/browser/builder';
import { Action, IAction } from 'vs/base/common/actions';
import { onUnexpectedError } from 'vs/base/common/errors';
import types = require('vs/base/common/types');
import { Position } from 'vs/platform/editor/common/editor';
import { IDiffEditor } from 'vs/editor/browser/editorBrowser';
import { IDiffEditorOptions, IEditorOptions } from 'vs/editor/common/editorCommon';
import { BaseTextEditor } from 'vs/workbench/browser/parts/editor/textEditor';
import { TextEditorOptions, TextDiffEditorOptions, EditorModel, EditorInput, EditorOptions } from 'vs/workbench/common/editor';
import { StringEditorInput } from 'vs/workbench/common/editor/stringEditorInput';
import { ResourceEditorInput } from 'vs/workbench/common/editor/resourceEditorInput';
import { DiffEditorInput } from 'vs/workbench/common/editor/diffEditorInput';
import { DiffNavigator } from 'vs/editor/contrib/diffNavigator/common/diffNavigator';
import { DiffEditorWidget } from 'vs/editor/browser/widget/diffEditorWidget';
import { TextDiffEditorModel } from 'vs/workbench/common/editor/textDiffEditorModel';
import { DelegatingWorkbenchEditorService } from 'vs/workbench/services/editor/browser/editorService';
import { IFileOperationResult, FileOperationResult } from 'vs/platform/files/common/files';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IEventService } from 'vs/platform/event/common/event';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { IMessageService } from 'vs/platform/message/common/message';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { RawContextKey, IContextKeyService, IContextKey } from 'vs/platform/contextkey/common/contextkey';
import { IThemeService } from 'vs/workbench/services/themes/common/themeService';
import { append, $, addClass, removeClass, finalHandler, join } from 'vs/base/browser/dom';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';

import { QueryInput } from 'sql/parts/query/common/queryInput';

export const TextCompareEditorVisible = new RawContextKey<boolean>('textCompareEditorVisible', false);

export class QueryEditor extends BaseEditor {

	static ID: string = 'workbench.editor.query';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IStorageService storageService: IStorageService,
		@IMessageService messageService: IMessageService,
		@IConfigurationService configurationService: IConfigurationService,
		@IEventService eventService: IEventService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService
	) {
		super(QueryEditor.ID, telemetryService);
	}

	public getTitle(): string {
		if (this.input) {
			return this.input.getName();
		}

		return 'Query Editor';
	}

	createEditor(parent: Builder): void {
		const container = parent.getHTMLElement();
		const root = append(container, $('.extension-editor'));
		let label = append(root, $('span.license.clickable'));
		label.textContent = 'Query Editor';
		label.style.display = 'block';
	}

	layout(): void {
	}

	setInput(input: QueryInput, options: EditorOptions): TPromise<void> {
		return super.setInput(input, options);
	}

	public dispose(): void {
		super.dispose();
	}
}
