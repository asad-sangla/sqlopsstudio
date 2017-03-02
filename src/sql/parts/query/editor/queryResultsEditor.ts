/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { EditorOptions } from 'vs/workbench/common/editor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { RawContextKey } from 'vs/platform/contextkey/common/contextkey';
import { append, $ } from 'vs/base/browser/dom';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { AppModule } from 'sql/parts/grid/views/app.module';
import { IQueryModelService } from 'sql/parts/query/common/queryModel';
import { IQueryParameterService } from 'sql/parts/query/execution/queryParameterService';

declare let AngularPlatformBrowserDynamic;

export const TextCompareEditorVisible = new RawContextKey<boolean>('textCompareEditorVisible', false);

/**
 * Editor associated with viewing and editing the data of a query results grid.
 */
export class QueryResultsEditor extends BaseEditor {

	static ID: string = 'workbench.editor.queryResultsEditor';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IQueryParameterService private _angularParameterService: IQueryParameterService
	) {
		super(QueryResultsEditor.ID, telemetryService);
	}

	createEditor(parent: Builder): void {
	}

	layout(dimension: Dimension): void {
	}

	setInput(input: QueryResultsInput, options: EditorOptions): TPromise<void> {
		super.setInput(input, options);
		if (!input.hasBootstrapped) {
			this._bootstrapAngular();
		}
		return TPromise.as<void>(null);
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private _bootstrapAngular(): void {
		let input = <QueryResultsInput>this.input;
		let uri = input.uri;

		// Pass the correct DataService to the new angular component
		let dataService = this._queryModelService.getDataService(uri);
		if (!dataService) {
			throw new Error('DataService not found for URI: ' + uri);
		}
		this._angularParameterService.dataService = dataService;

		input.setBootstrappedTrue();

		const parent = this.getContainer().getHTMLElement();
		append(parent, $('slickgrid-container'));

		// Bootstrap the angular content
		let providers = [ {provide: 'ParameterService', useValue: this._angularParameterService } ];
		AngularPlatformBrowserDynamic.platformBrowserDynamic(providers).bootstrapModule(AppModule);
	}

	public dispose(): void {
		super.dispose();
	}
}