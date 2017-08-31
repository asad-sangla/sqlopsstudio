/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/primeng';
import 'vs/css!sql/parts/grid/media/slickColorTheme';
import 'vs/css!sql/parts/grid/media/flexbox';
import 'vs/css!sql/parts/grid/media/styles';
import 'vs/css!sql/parts/grid/media/slick.grid';
import 'vs/css!sql/parts/grid/media/slickGrid';

import { ElementRef, ChangeDetectorRef, OnInit, OnDestroy, Component, Inject, forwardRef, ViewChild } from '@angular/core';
import { IBootstrapService, BOOTSTRAP_SERVICE_ID } from 'sql/services/bootstrap/bootstrapService';
import { QueryComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { QueryComponent } from 'sql/parts/grid/views/query/query.component';
import { QueryPlanComponent,  } from 'sql/parts/queryPlan/queryPlan.component';
import { TopOperationsComponent } from 'sql/parts/queryPlan/topOperations.component';
import { ChartViewerComponent } from 'sql/parts/grid/views/query/chartViewer.component';
import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';
import { PanelComponent, IPanelOptions } from 'sql/base/browser/ui/panel/panel.component';

import * as nls from 'vs/nls';
import { IDisposable } from 'vs/base/common/lifecycle';

export const QUERY_OUTPUT_SELECTOR: string = 'query-output-component';

declare type PaneType = 'messages' | 'results';

@Component({
	selector: QUERY_OUTPUT_SELECTOR,
	templateUrl: require.toUrl('sql/parts/query/views/queryOutput.template.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})
export class QueryOutputComponent implements OnInit, OnDestroy {

	@ViewChild('queryComponent') queryComponent: QueryComponent;

	@ViewChild('queryPlanComponent') queryPlanComponent: QueryPlanComponent;

	@ViewChild('topOperationsComponent') topOperationsComponent: TopOperationsComponent;

	@ViewChild('chartViewerComponent') chartViewerComponent: ChartViewerComponent;

	@ViewChild(PanelComponent) private _panel: PanelComponent;

	// tslint:disable:no-unused-variable
	private readonly queryComponentTitle: string = nls.localize('results', 'Results');
	private readonly queryPlanTitle: string = nls.localize('queryPlan', 'Query Plan');
	private readonly topOperationsTitle: string = nls.localize('topOperations', 'Top Operations');
	private readonly chartViewerTitle: string = nls.localize('chartViewer', 'Chart Viewer');
	// tslint:enable:no-unused-variable

	private hasQueryPlan = false;
	private showChartView = false;

	// tslint:disable-next-line:no-unused-variable
	private readonly panelOpt: IPanelOptions = {
		showTabsWhenOne: false
	};

	public queryParameters: QueryComponentParams;

	private _disposables: Array<IDisposable> = [];

	constructor(
		@Inject(forwardRef(() => ElementRef)) el: ElementRef,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _cd: ChangeDetectorRef,
		@Inject(BOOTSTRAP_SERVICE_ID) bootstrapService: IBootstrapService
	) {
		this.queryParameters = bootstrapService.getBootstrapParams(el.nativeElement.tagName);
	}

	/**
	 * Called by Angular when the object is initialized
	 */
	public ngOnInit(): void {
		this._disposables.push(toDisposableSubscription(this.queryComponent.queryPlanAvailable.subscribe((xml) => {
			this.hasQueryPlan = true;
			this._cd.detectChanges();
			this.queryPlanComponent.planXml = xml;
			this.topOperationsComponent.planXml = xml;
			this._panel.selectTab('queryPlan');
		})));

		this._disposables.push(toDisposableSubscription(this.queryComponent.showChartRequested.subscribe((dataSet) => {
			this.showChartView = true;
			this._cd.detectChanges();
			this.chartViewerComponent.dataSet = dataSet;
			this._panel.selectTab('chartView');
		})));
	}

	public ngOnDestroy(): void {
		this._disposables.forEach(i => i.dispose());
	}
}
