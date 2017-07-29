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
import { TabPanel, TabView } from 'primeng/primeng';
import * as dom from 'vs/base/browser/dom';
const $ = dom.$;

export const QUERY_OUTPUT_SELECTOR: string = 'query-output-component';

declare type PaneType = 'messages' | 'results';

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

	public hasQueryPlanTab: boolean = false;

	public queryParameters: QueryComponentParams;

	public activeTab: number = 0;

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
		this.queryComponent.queryPlanAvailable.subscribe((xml) => {
			if (!this.hasQueryPlanTab) {
				this.hasQueryPlanTab = true;

				for (let i = 0; i < this.tabComponent.tabs.length; ++i) {
					this.tabComponent.tabs[i].selected = false;
				}

				let tab: TabPanel = new TabPanel();
				tab.header = 'Query Plan';
				tab.selected = true;
				tab.disabled = false;
				tab.closable = false;
				tab.closed = false;
				this.tabComponent.tabs.push(tab);

				let topOperationsTab: TabPanel = new TabPanel();
				topOperationsTab.header = 'Top Operations';
				topOperationsTab.selected = false;
				topOperationsTab.disabled = false;
				topOperationsTab.closable = false;
				topOperationsTab.closed = false;
				this.tabComponent.tabs.push(topOperationsTab);
			}

			this.enterTabMode();
			this.onActiveTabChanged(1);
			this.queryPlanComponent.planXml = xml;
			this.topOperationsComponent.planXml = xml;
		});

		this.queryComponent.queryExecutionStatus.subscribe((status) => {
			if (status === 'start') {
				this.enterResultsOnlyMode();
			}
		});
	}

	public ngOnDestroy(): void {
		this.queryComponent.queryPlanAvailable.unsubscribe();
		this.queryComponent.queryExecutionStatus.unsubscribe();
	}

	public handleTabChange(e) {
		this.onActiveTabChanged(e.index);
	}

	private onActiveTabChanged(index: number): void {
		this.activeTab = index;

		document.getElementById('queryDiv').style.display = 'none';
		document.getElementById('queryPlanDiv').style.display = 'none';
		document.getElementById('topOperationsDiv').style.display = 'none';

		if (this.isQuery) {
			document.getElementById('queryDiv').style.display = 'block';
		} else if (this.isPlan) {
			document.getElementById('queryPlanDiv').style.display = 'block';
		} else if (this.isTopOperations) {
			document.getElementById('topOperationsDiv').style.display = 'block';
		}

		this._cd.detectChanges();
	}

	private enterTabMode(): void {
		document.getElementById("queryOutputTab").style.display = "block";
		let queryComp = document.getElementById("queryComp");
		dom.addClass(queryComp, 'headersVisible');
	}

	private enterResultsOnlyMode(): void {
		// hide the tab control
		document.getElementById("queryOutputTab").style.display = "none";
		let queryComp = document.getElementById("queryComp");
		dom.removeClass(queryComp, 'headersVisible');

		// reset back to a single tab for the results
		if (this.tabComponent && this.tabComponent.tabs) {
			if (this.tabComponent.tabs.length > 1) {
				this.hasQueryPlanTab = false;
				this.tabComponent.tabs = [this.tabComponent.tabs[0]];
			}
			this.tabComponent.tabs[0].selected = true;
			this.onActiveTabChanged(0);
		}
	}

	public get isQuery(): boolean {
		return this.activeTab === 0;
	}

	public get isPlan(): boolean {
		return this.activeTab === 1;
	}

	public get isTopOperations(): boolean {
		return this.activeTab === 2;
	}
}
