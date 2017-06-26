/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef } from '@angular/core';
import { NgGridConfig } from 'angular4-grid';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';

@Component({
	selector: 'dashboard-page',
	templateUrl: require.toUrl('sql/parts/dashboard/common/dashboardPage.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')],
	host: {
		class: 'dashboard-page'
	}
})
export class DashboardPage {

	protected SKELETON_WIDTH = 5;
	protected widgets: Array<WidgetConfig> = [];
	protected gridConfig: NgGridConfig = {
		'margins': [10],            //  The size of the margins of each item. Supports up to four values in the same way as CSS margins. Can be updated using setMargins()
		'draggable': false,          //  Whether the items can be dragged. Can be updated using enableDrag()/disableDrag()
		'resizable': false,          //  Whether the items can be resized. Can be updated using enableResize()/disableResize()
		'max_cols': this.SKELETON_WIDTH,              //  The maximum number of columns allowed. Set to 0 for infinite. Cannot be used with max_rows
		'max_rows': 0,              //  The maximum number of rows allowed. Set to 0 for infinite. Cannot be used with max_cols
		'visible_cols': 0,          //  The number of columns shown on screen when auto_resize is set to true. Set to 0 to not auto_resize. Will be overriden by max_cols
		'visible_rows': 0,          //  The number of rows shown on screen when auto_resize is set to true. Set to 0 to not auto_resize. Will be overriden by max_rows
		'min_cols': 0,              //  The minimum number of columns allowed. Can be any number greater than or equal to 1.
		'min_rows': 0,              //  The minimum number of rows allowed. Can be any number greater than or equal to 1.
		'col_width': 250,           //  The width of each column
		'row_height': 250,          //  The height of each row
		'cascade': 'left',            //  The direction to cascade grid items ('up', 'right', 'down', 'left')
		'min_width': 100,           //  The minimum width of an item. If greater than col_width, this will update the value of min_cols
		'min_height': 100,          //  The minimum height of an item. If greater than row_height, this will update the value of min_rows
		'fix_to_grid': false,       //  Fix all item movements to the grid
		'auto_style': true,         //  Automatically add required element styles at run-time
		'auto_resize': false,       //  Automatically set col_width/row_height so that max_cols/max_rows fills the screen. Only has effect is max_cols or max_rows is set
		'maintain_ratio': false,    //  Attempts to maintain aspect ratio based on the colWidth/rowHeight values set in the config
		'prefer_new': false,        //  When adding new items, will use that items position ahead of existing items
		'limit_to_screen': true,   //  When resizing the screen, with this true and auto_resize false, the grid will re-arrange to fit the screen size. Please note, at present this only works with cascade direction up.
	};

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) protected dashboardService: DashboardServiceInterface
	) { }

	/**
	 * Adds the provider to current widgets and any passed widgets (for locally defined widget)
	 * @param widgets Array of widgets to add provider onto other than this.widgets
	 */
	protected addProvider(addWidgets?: Array<WidgetConfig>): void {
		let provider = this.dashboardService.connectionManagementService.connectionInfo.providerId;
		let totalWidgets = addWidgets ? this.widgets.concat(addWidgets) : this.widgets;
		totalWidgets.forEach((item) => {
			item.provider = provider;
		});
	}

	/**
	 * Adds passed context to this.widgets and passed widgets
	 * @param context Context to add ('database' or 'server' atm)
	 * @param widgets Additional widgets to add context to
	 */
	protected addContext(context: string, addWidgets?: Array<WidgetConfig>): void {
		let totalWidgets = addWidgets ? this.widgets.concat(addWidgets) : this.widgets;
		totalWidgets.forEach((item) => {
			item.context = context;
		});
	}
}
