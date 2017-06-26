/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Component, Inject, ViewContainerRef, forwardRef, AfterContentInit,
	ComponentFactoryResolver } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WIDGET_CONFIG, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import { CountInsight } from './viewInsights/countInsight.component';

import { SimpleExecuteResult } from 'data';

export interface InsightsView {
	data: SimpleExecuteResult;
	colorMap: {[column: string]: string};
}

export interface InsightsConfig {
	type: 'count' | 'chart';
	detailsQuery?: string;
	query: string;
	colorMap?: {[column: string]: string};
}

const insightMap = {
	'count': CountInsight
};

@Component({
	selector: 'insights-widget',
	template: ''
})
export class InsightsWidget extends DashboardWidget implements IDashboardWidget, AfterContentInit {
	private insightConfig: InsightsConfig;
	private queryThenable: Thenable<SimpleExecuteResult>;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => DashboardServiceInterface)) dashboardService: DashboardServiceInterface,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig,
		@Inject(forwardRef(() => ViewContainerRef)) private viewContainerRef: ViewContainerRef
	) {
		super();
		this.insightConfig = <InsightsConfig> this._config.config;
		if (this.insightConfig.query === undefined || this.insightConfig.query === '') {
			console.error('Query was undefined or empty, config: ', this._config);
		} else {
			this.queryThenable = dashboardService.queryManagementService.runQueryAndReturn(this.insightConfig.query);
		}
	}

	ngAfterContentInit() {
		let self = this;
		self.queryThenable.then(
			result => {
				if (result.rowCount === 0) {
					self.showError('No results to show');
					return;
				}

				let componentFactory = self._componentFactoryResolver.resolveComponentFactory(insightMap[self.insightConfig.type]);
				self.viewContainerRef.clear();

				let componentRef = self.viewContainerRef.createComponent(componentFactory);
				let componentInstance = <InsightsView> componentRef.instance;
				componentInstance.data = result;
				componentInstance.colorMap = self.insightConfig.colorMap;
			},
			error => {
				self.showError(error);
			}
		);
	}

	private showError(error: string): void {
		let element = <HTMLElement> this.viewContainerRef.element.nativeElement;
		element.innerText = error;
	}
}