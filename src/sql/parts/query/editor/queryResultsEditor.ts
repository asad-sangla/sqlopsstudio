/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { EditorOptions } from 'vs/workbench/common/editor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { RawContextKey, IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IThemeService } from 'vs/workbench/services/themes/common/themeService';
import { append, $ } from 'vs/base/browser/dom';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { AppModule } from 'sql/parts/grid/views/app.module';

declare let AngularPlatformBrowserDynamic;

export const TextCompareEditorVisible = new RawContextKey<boolean>('textCompareEditorVisible', false);

/**
 * Editor associated with viewing and editing the data of a query results grid.
 */
export class QueryResultsEditor extends BaseEditor {

	static ID: string = 'workbench.editor.queryResultsEditor';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IWorkspaceContextService contextService: IWorkspaceContextService,
		@IStorageService storageService: IStorageService,
		@IMessageService messageService: IMessageService,
		@IConfigurationService configurationService: IConfigurationService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IThemeService themeService: IThemeService
	) {
		super(QueryResultsEditor.ID, telemetryService);
	}

	createEditor(parent: Builder): void {
		append(parent.getHTMLElement(), $('slickgrid-container'));
		AngularPlatformBrowserDynamic.platformBrowserDynamic().bootstrapModule(AppModule);
	}

	layout(dimension: Dimension): void {
	}

	setInput(input: QueryResultsInput, options: EditorOptions): TPromise<void> {
		return super.setInput(input, options);
	}

	public dispose(): void {
		super.dispose();
	}
}