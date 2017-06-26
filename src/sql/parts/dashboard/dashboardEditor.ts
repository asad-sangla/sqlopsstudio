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
import { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { DashboardInput } from './dashboardInput';
import { DashboardModule } from './dashboard.module';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { DASHBOARD_SELECTOR } from 'sql/parts/dashboard/dashboard.component';

export class DashboardEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.connectiondashboard';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IWorkbenchThemeService themeService: IWorkbenchThemeService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IBootstrapService private _bootstrapService: IBootstrapService
	) {
		super(DashboardEditor.ID, telemetryService, themeService);
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

		if (!input.hasInitialized) {
			this.bootstrapAngular(input);
		}
		this.revealElementWithTagName(input.uniqueSelector, this.getContainer().getHTMLElement());

		return super.setInput(input, options);
	}

	/**
	 * Reveal the child element with the given tagName and hide all other elements.
	 */
	private revealElementWithTagName(tagName: string, parent: HTMLElement): void {
		let elementToReveal: HTMLElement;

		for(let i = 0; i < parent.children.length; i++) {
			let child: HTMLElement = <HTMLElement>parent.children[i];
			if (child.tagName && child.tagName.toLowerCase() === tagName && !elementToReveal) {
				elementToReveal = child;
			} else {
				child.style.display = 'none';
			}
		}

		if (elementToReveal) {
			elementToReveal.style.display = '';
		}
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private bootstrapAngular(input: DashboardInput): void {

		// Get the bootstrap params and perform the bootstrap
		let params: DashboardComponentParams = {
			connection: input.getConnectionInfo(),
			ownerUri: input.getUri()
		};
		let uniqueSelector = this._bootstrapService.bootstrap(
			DashboardModule,
			this.getContainer().getHTMLElement(),
			DASHBOARD_SELECTOR,
			params,
			input);
		input.setUniqueSelector(uniqueSelector);
	}

	public dispose(): void {
		super.dispose();
	}
}
