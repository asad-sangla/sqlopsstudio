/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryEditor';
import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { append, $ } from 'vs/base/browser/dom';
import { DashboardInput } from './dashboardInput';
import { AppModule } from './app.module';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

declare let AngularPlatformBrowserDynamic;

export class DashboardEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.connectiondashboard';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService
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

	setInput(input: DashboardInput, options: EditorOptions): TPromise<void> {
		super.setInput(input, options);

		this.bootstrapAngular();

		return TPromise.as<void>(null);
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private bootstrapAngular(): void {
		let input = <DashboardInput>this.input;
		let connection: IConnectionProfile = input.getConnectionProfile();

		//input.setBootstrappedTrue();

		const parent = this.getContainer().getHTMLElement();
		append(parent, $('connection-dashboard'));

		// Bootstrap the angular content
		let providers = [ {provide: 'ConnectionProfile', useValue: connection } ];
		AngularPlatformBrowserDynamic.platformBrowserDynamic(providers).bootstrapModule(AppModule);
	}
}
