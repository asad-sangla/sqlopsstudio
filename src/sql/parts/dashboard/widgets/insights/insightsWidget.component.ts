/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
	Component, Inject, ViewContainerRef, forwardRef, AfterContentInit,
	ComponentFactoryResolver, ViewChild, Type, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DashboardWidget, IDashboardWidget, WIDGET_CONFIG, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { InsightAction, InsightActionContext } from 'sql/common/baseActions';
import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';

/* Insights */
import { ChartInsight } from './viewInsights/chartInsight.component';
import { CountInsight } from './viewInsights/countInsight.component';

import { SimpleExecuteResult } from 'data';

import { IDisposable } from 'vs/base/common/lifecycle';
import { Action } from 'vs/base/common/actions';

export interface IInsightsView {
	data: SimpleExecuteResult;
	customFields: Array<string>;
}

export interface IStateCondition {
	condition: {
		if: string,
		equals?: string
	};
	color?: string;
	icon?: string;
}

export interface IInsightLabel {
	column: string;
	icon?: string;
	state?: Array<IStateCondition>;
}

export interface InsightsConfig {
	type: 'count' | 'chart';
	query: string;
	colorMap?: { [column: string]: string };
	detailsQuery?: string;
	label?: IInsightLabel | string;
	value?: string;
}

const insightMap: { [x: string]: Type<IInsightsView> } = {
	'chart': ChartInsight,
	'count': CountInsight
};

@Component({
	selector: 'insights-widget',
	template: '<div component-host></div>'
})
export class InsightsWidget extends DashboardWidget implements IDashboardWidget, AfterContentInit, OnDestroy {
	private insightConfig: InsightsConfig;
	private queryObv: Observable<SimpleExecuteResult>;
	private _disposables: Array<IDisposable> = [];
	@ViewChild(ComponentHostDirective) private componentHost: ComponentHostDirective;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => DashboardServiceInterface)) private dashboardService: DashboardServiceInterface,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig,
		@Inject(forwardRef(() => ViewContainerRef)) private viewContainerRef: ViewContainerRef
	) {
		super();
		this.insightConfig = <InsightsConfig>this._config.config;
		if (this.insightConfig.query === undefined || this.insightConfig.query === '') {
			console.error('Query was undefined or empty, config: ', this._config);
		} else {
			this.queryObv = Observable.fromPromise(dashboardService.queryManagementService.runQueryAndReturn(this.insightConfig.query));
		}
	}

	ngAfterContentInit() {
		let self = this;
		this._disposables.push(toDisposableSubscription(self.queryObv.subscribe(
			result => {
				if (result.rowCount === 0) {
					self.showError('No results to show');
					return;
				}

				let componentFactory = self._componentFactoryResolver.resolveComponentFactory<IInsightsView>(insightMap[self.insightConfig.type]);
				self.viewContainerRef.clear();

				let componentRef = self.componentHost.viewContainerRef.createComponent(componentFactory);
				let componentInstance = <IInsightsView>componentRef.instance;
				componentInstance.data = result;
				componentInstance.customFields.forEach((field) => {
					componentInstance[field] = self.insightConfig[field];
				});
			},
			error => {
				self.showError(error);
			}
		)));
	}

	ngOnDestroy() {
		this._disposables.forEach(i => i.dispose());
	}

	private showError(error: string): void {
		let element = <HTMLElement>this.viewContainerRef.element.nativeElement;
		element.innerText = error;
	}

	//tslint:disable-next-line
	private onClick(event: any) {
		this.dashboardService.openInsight(this.insightConfig);
	}

	get actions(): Array<Action> {
		if (this.insightConfig.detailsQuery) {
			return [this.dashboardService.instantiationService.createInstance(InsightAction, InsightAction.ID, InsightAction.LABEL)];
		} else {
			return [];
		}
	}

	get actionsContext(): InsightActionContext {
		return <InsightActionContext>{
			profile: this.dashboardService.connectionManagementService.connectionInfo.connectionProfile,
			insight: this.insightConfig
		};
	}
}