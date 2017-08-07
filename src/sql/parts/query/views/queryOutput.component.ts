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

import { TabPanel, TabView } from 'primeng/primeng';

import * as dom from 'vs/base/browser/dom';
import { IDisposable } from 'vs/base/common/lifecycle';
const $ = dom.$;

export const QUERY_OUTPUT_SELECTOR: string = 'query-output-component';

declare type PaneType = 'messages' | 'results';

interface TabInfo {
	name: string;
	header: string;
	index?: number;
	visible?: boolean;
}

const queryOutputTabName = 'queryOutputTab';
const resultsTabName = 'queryDiv';
const queryPlanTabName = 'queryPlanDiv';
const topOperationsTabName = 'topOperationsDiv';
const chartViewerTabName = 'chartViewerDiv';

@Component({
	selector: QUERY_OUTPUT_SELECTOR,
	templateUrl: require.toUrl('sql/parts/query/views/queryOutput.template.html'),
	styleUrls: [require.toUrl('sql/media/primeng.css')]
})

export class QueryOutputComponent implements OnInit, OnDestroy {

	@ViewChild('queryComponent') queryComponent: QueryComponent;

	@ViewChild('tabComponent') tabComponent: TabView;

	@ViewChild('queryPlanComponent') queryPlanComponent: QueryPlanComponent;

	@ViewChild('topOperationsComponent') topOperationsComponent: TopOperationsComponent;

	@ViewChild('chartViewerComponent') chartViewerComponent: ChartViewerComponent;


	public queryParameters: QueryComponentParams;

	public activeTab: number = 0;

	private _tabIndexMap = new Map<string,TabInfo>();
	private _disposables: Array<IDisposable> = [];

	constructor(
		@Inject(forwardRef(() => ElementRef)) el: ElementRef,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _cd: ChangeDetectorRef,
		@Inject(BOOTSTRAP_SERVICE_ID) bootstrapService: IBootstrapService
	) {
		this.queryParameters = bootstrapService.getBootstrapParams(el.nativeElement.tagName);
		let tabInfo: TabInfo[] = [
			{ name: resultsTabName, header: 'Results'},
			{ name: queryPlanTabName, header: 'Query Plan'},
			{ name: topOperationsTabName, header: 'Top Operations'},
			{ name: chartViewerTabName, header: 'Chart View'},
		];
		tabInfo.forEach((info) => {
			info.index = -1;
			info.visible = false;
			this._tabIndexMap.set(info.name, info);
		});
		// Ensure results tab is always set as it's always in the list of tabs
		this._tabIndexMap.get(resultsTabName).index = 0;
	}

	/**
	 * Called by Angular when the object is initialized
	 */
	public ngOnInit(): void {
		this._disposables.push(toDisposableSubscription(this.queryComponent.queryPlanAvailable.subscribe((xml) => {
			let queryPlanTab = this._tabIndexMap.get(queryPlanTabName);
			if (!queryPlanTab.visible) {
				queryPlanTab.visible = true;
				this.deselectAllTabs();
				this.ensureTabCreated(queryPlanTab);
				this.ensureTabCreated(this._tabIndexMap.get(topOperationsTabName));
			}

			this.enterTabMode();
			this.onActiveTabChanged(this._tabIndexMap.get(queryPlanTabName).index);
			this.queryPlanComponent.planXml = xml;
			this.topOperationsComponent.planXml = xml;
		})));

		this._disposables.push(toDisposableSubscription(this.queryComponent.queryExecutionStatus.subscribe((status) => {
			if (status === 'start') {
				this.enterResultsOnlyMode();
			}
		})));

		this._disposables.push(toDisposableSubscription(this.queryComponent.showChartRequested.subscribe((dataSet) => {
			this.chartViewerComponent.dataSet = dataSet;

			let chartViewerTab = this._tabIndexMap.get(chartViewerTabName);
			if (!chartViewerTab.visible) {
				chartViewerTab.visible = true;
				this.deselectAllTabs();
				this.ensureTabCreated(chartViewerTab);
			}
			this.enterTabMode();
			this.onActiveTabChanged(this._tabIndexMap.get(chartViewerTabName).index);
		})));
	}

	private deselectAllTabs(): void {
		for (let i = 0; i < this.tabComponent.tabs.length; ++i) {
			this.tabComponent.tabs[i].selected = false;
		}
	}

	/**
	 * Sets all tabs invisible and resets their tab index
	 *
	 * @private
	 * @memberof QueryOutputComponent
	 */
	private resetAllTabs(): void {
		this._tabIndexMap.forEach((info) => {
			info.visible = false;
			info.index = -1;
		});
	}

	private ensureTabCreated(info: TabInfo): void {
		let panel = this.tabComponent.tabs.find( tab => tab.header === info.header);
		if (!panel) {
			let tab: TabPanel = new TabPanel();
			tab.header = info.header;
			tab.selected = info.visible;
			tab.disabled = false;
			tab.closable = false;
			tab.closed = false;
			this.tabComponent.tabs.push(tab);
			info.index = this.tabComponent.tabs.length - 1;
		}
	}

	public ngOnDestroy(): void {
		this._disposables.forEach(i => i.dispose());
	}

	public handleTabChange(e) {
		this.onActiveTabChanged(e.index);
	}

	private onActiveTabChanged(index: number): void {
		let activeTabInfo: TabInfo = this.getTabInfoForIndex(index);
		if (activeTabInfo === undefined) {
			throw Error('Active tab is not in known tab range');
		}
		this.activeTab = index;
		let activeTabName = activeTabInfo.name;

		// Disable other tabs, enable the active tab
		this._tabIndexMap.forEach(tabInfo => {
			let tabEl = document.getElementById(tabInfo.name);
			if (tabEl) {
				tabEl.style.display = (activeTabName === tabInfo.name) ? 'block' : 'none';
			}
		});
		this.tabComponent.tabs[index].selected = true;
		this._cd.detectChanges();
	}

	private getTabInfoForIndex(index: number): TabInfo {
		let info: TabInfo = undefined;
		this._tabIndexMap.forEach(value => {
			if (value.index === index) {
				info = value;
			}
		});
		return info;
	}

	private enterTabMode(): void {
		document.getElementById(queryOutputTabName).style.display = 'block';
		let queryComp = document.getElementById('queryComp');
		dom.addClass(queryComp, 'headersVisible');
	}

	private enterResultsOnlyMode(): void {
		// hide the tab control
		document.getElementById('queryOutputTab').style.display = 'none';
		let queryComp = document.getElementById('queryComp');
		dom.removeClass(queryComp, 'headersVisible');

		// reset back to a single tab for the results
		if (this.tabComponent && this.tabComponent.tabs) {
			if (this.tabComponent.tabs.length > 1) {
				this.resetAllTabs();
				this.tabComponent.tabs = [this.tabComponent.tabs[0]];
			}
			this.tabComponent.tabs[0].selected = true;
			let tabInfo: TabInfo = this._tabIndexMap.get(resultsTabName);
			tabInfo.index = 0;
			tabInfo.visible = true;
			this.onActiveTabChanged(tabInfo.index);
		}
	}
}
