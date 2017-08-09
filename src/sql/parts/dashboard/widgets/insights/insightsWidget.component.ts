/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import {
	Component, Inject, ViewContainerRef, forwardRef, AfterContentInit,
	ComponentFactoryResolver, ViewChild, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DashboardWidget, IDashboardWidget, WIDGET_CONFIG, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { InsightAction, InsightActionContext } from 'sql/workbench/electron-browser/actions';
import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';
import { IInsightsConfig, IInsightsView } from './interfaces';
import { Extensions, IInsightRegistry } from 'sql/platform/dashboard/common/insightRegistry';
import { insertValueRegex } from 'sql/parts/insights/insightsDialog';

import { SimpleExecuteResult } from 'data';

import { IDisposable } from 'vs/base/common/lifecycle';
import { Action } from 'vs/base/common/actions';
import * as types from 'vs/base/common/types';
import * as pfs from 'vs/base/node/pfs';
import * as nls from 'vs/nls';
import { Registry } from 'vs/platform/registry/common/platform';

const insightRegistry = Registry.as<IInsightRegistry>(Extensions.InsightContribution);

@Component({
	selector: 'insights-widget',
	template: `
				<div style="margin: 10px; width: calc(100% - 20px); height: calc(100% - 20px)">
					<ng-template component-host></ng-template>
				</div>`,
	styles: [':host { width: 100%; height: 100%}']
})
export class InsightsWidget extends DashboardWidget implements IDashboardWidget, AfterContentInit, OnDestroy {
	private insightConfig: IInsightsConfig;
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
		this.insightConfig = <IInsightsConfig>this._config.widget['insights-widget'];
		if (!this.insightConfig.query && !this.insightConfig.queryFile) {
			console.error('Query was undefined or empty, config: ', this._config);
		} else if (types.isStringArray(this.insightConfig.query)) {
			this.queryObv = Observable.fromPromise(dashboardService.queryManagementService.runQueryAndReturn(this.insightConfig.query.join(' ')));
		} else if (types.isString(this.insightConfig.query)) {
			this.queryObv = Observable.fromPromise(dashboardService.queryManagementService.runQueryAndReturn(this.insightConfig.query));
		} else if (types.isString(this.insightConfig.queryFile)) {
			let filePath = this.insightConfig.queryFile;
			// check for workspace relative path
			let match = filePath.match(insertValueRegex);
			if (match && match.length > 0 && match[1] === 'workspaceRoot') {
				filePath = filePath.replace(match[0], '');
				filePath = this.dashboardService.workspaceContextService.toResource(filePath).fsPath;
			}
			let self = this;
			self.queryObv = Observable.fromPromise(new Promise((resolve, reject) => {
				pfs.readFile(filePath).then(
					buffer => {
						dashboardService.queryManagementService.runQueryAndReturn(buffer.toString()).then(
							result => {
								resolve(result);
							},
							error => {
								reject(error);
							}
						);
					},
					error => {
						console.error(error);
						reject(error);
					}
				);
			}));
		} else {
			console.error('Error occursed while parsing config file for insight. Config: ', this.insightConfig);
		}
	}

	ngAfterContentInit() {
		let self = this;
		if (self.queryObv) {
			this._disposables.push(toDisposableSubscription(self.queryObv.subscribe(
				result => {
					if (result.rowCount === 0) {
						self.showError(nls.localize('noResults', 'No results to show'));
						return;
					}
					if (Object.keys(self.insightConfig.type).length !== 1) {
						console.error('Exactly 1 insight type must be specified');
						return;
					}
					let typeKey = Object.keys(self.insightConfig.type)[0];

					let componentFactory = self._componentFactoryResolver.resolveComponentFactory<IInsightsView>(insightRegistry.getCtorFromId(typeKey));
					self.componentHost.viewContainerRef.clear();

					let componentRef = self.componentHost.viewContainerRef.createComponent(componentFactory);
					let componentInstance = componentRef.instance;
					componentInstance.data = { columns: result.columnInfo.map(item => item.columnName), rows: result.rows.map(row => row.map(item => item.displayValue)) };
					// check if the setter is defined
					componentInstance.config = self.insightConfig.type[typeKey];
					if (componentInstance.init) {
						componentInstance.init();
					}
				},
				error => {
					self.showError(error);
				}
			)));
		} else {
			self.showError(nls.localize('invalidConfig', 'Could not parse config correctly'));
		}
	}

	ngOnDestroy() {
		this._disposables.forEach(i => i.dispose());
	}

	private showError(error: string): void {
		let element = <HTMLElement>this.viewContainerRef.element.nativeElement;
		element.innerText = error;
	}

	get actions(): Array<Action> {
		if (this.insightConfig.details && (this.insightConfig.details.query || this.insightConfig.details.queryFile)) {
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