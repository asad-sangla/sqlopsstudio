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
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryModule } from 'sql/parts/grid/views/query/query.module';
import { IQueryModelService } from 'sql/parts/query/execution/queryModel';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { QueryComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { QUERY_SELECTOR } from 'sql/parts/grid/views/query/query.component';
import { IThemeService } from 'vs/platform/theme/common/themeService';

export const TextCompareEditorVisible = new RawContextKey<boolean>('textCompareEditorVisible', false);

/**
 * Editor associated with viewing and editing the data of a query results grid.
 */
export class QueryResultsEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.queryResultsEditor';
	public static AngularSelectorString: string = 'slickgrid-container.slickgridContainer';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IQueryModelService private _queryModelService: IQueryModelService,
		@IBootstrapService private _bootstrapService: IBootstrapService
	) {
		super(QueryResultsEditor.ID, telemetryService, themeService);
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

		// Mark that we have bootstrapped
		input.setBootstrappedTrue();

		// Get the bootstrap params and perform the bootstrap
		let params: QueryComponentParams = { dataService: dataService };
		this._bootstrapService.bootstrap(
			QueryModule,
			this.getContainer().getHTMLElement(),
			QUERY_SELECTOR,
			params);
	}

	public dispose(): void {
		super.dispose();
	}
}