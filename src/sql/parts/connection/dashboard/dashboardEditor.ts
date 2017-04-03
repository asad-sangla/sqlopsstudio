/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';
import { Dimension, Builder } from 'vs/base/browser/builder';
import { EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { DashboardInput } from './dashboardInput';
import { DashboardModule } from './dashboard.module';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IMetadataService } from 'sql/parts/metadata/metadataService';
import { IScriptingService } from 'sql/parts/scripting/scriptingService';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IBootstrapService } from 'sql/parts/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/parts/bootstrap/bootstrapParams';
import { AppComponent } from "./dashboard.component";

export class DashboardEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.connectiondashboard';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@IMetadataService private _metadataService: IMetadataService,
		@IScriptingService private _scriptingService: IScriptingService,
		@IQueryEditorService private _queryEditorService: IQueryEditorService,
		@IBootstrapService private _bootstrapService: IBootstrapService
	) {
		super(DashboardEditor.ID, telemetryService);
	}

	/**
	 * Called to create the editor in the parent builder.
	 */
	public createEditor(parent: Builder): void {
	}

	/**
	 * Sets focus on this editor. Specifically, it sets the focus on the hosted text editor.
	 */
	public focus(): void {
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: Dimension): void {
	}

	public setInput(input: DashboardInput, options: EditorOptions): TPromise<void> {
		if (this.input instanceof DashboardInput && this.input.matches(input)) {
			return TPromise.as(undefined);
		}

		//if (!input.hasInitialized) {
			this.bootstrapAngular(input);
		//}

		return super.setInput(input, options);
	}


	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private bootstrapAngular(input: DashboardInput): void {

		input.setHasInitialized();

		// Get the bootstrap params and perform the bootstrap
		let params: DashboardComponentParams = {
			ownerUri: input.getUri(),
			connection: input.getConnectionProfile()
		};
		this._bootstrapService.bootstrap(
			DashboardModule,
			this.getContainer().getHTMLElement(),
			AppComponent.AngularSelectorString,
			input.getUri(),
			params);
	}

	public dispose(): void {
		super.dispose();
	}
}
