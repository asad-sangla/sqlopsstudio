/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef } from '@angular/core';
import { NgGridConfig } from 'angular2-grid';
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
export abstract class DashboardPage {

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

	// a set of config modifiers
	private readonly _configModifiers: Array<(item: Array<WidgetConfig>) => Array<WidgetConfig>> = [
		this.validateConfig,
		this.addProvider,
		this.addEdition,
		this.addContext,
		this.filterWidgets
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) protected dashboardService: DashboardServiceInterface
	) { }

	protected init() {
		let tempWidgets = this.dashboardService.getSettings(this.context);
		let properties = this.propertiesWidget;
		this._configModifiers.forEach((cb) => {
			tempWidgets = cb.apply(this, [tempWidgets]);
			properties = cb.apply(this, [[properties]])[0];
		});
		this.widgets = tempWidgets;
		this.propertiesWidget = properties;
	}

	protected abstract propertiesWidget: WidgetConfig;
	protected abstract get context(): string;

	/**
	 * Returns a filtered version of the widgets pass based on edition and provider
	 * @param config widgets to filter
	 */
	private filterWidgets(config: WidgetConfig[]): Array<WidgetConfig> {
		let returnConfig = config;
		// filter by provider
		returnConfig = returnConfig.filter((item) => {
			return item.provider === undefined || item.provider === this.dashboardService.connectionManagementService.connectionInfo.providerId;
		});
		//filter by edition
		returnConfig = returnConfig.filter((item) => {
			return item.edition === undefined || item.edition === this.dashboardService.connectionManagementService.connectionInfo.serverInfo.engineEditionId;
		});
		return returnConfig;
	}

	/**
	 * Add provider to the passed widgets and returns the new widgets
	 * @param widgets Array of widgets to add provider onto
	 */
	protected addProvider(config: WidgetConfig[]): Array<WidgetConfig> {
		let provider = this.dashboardService.connectionManagementService.connectionInfo.providerId;
		return config.map((item) => {
			if (item.provider === undefined) {
				item.provider = provider;
			}
			return item;
		});
	}

	/**
	 * Adds the edition to the passed widgets and returns the new widgets
	 * @param widgets Array of widgets to add edition onto
	 */
	protected addEdition(config: WidgetConfig[]): Array<WidgetConfig> {
		let edition = this.dashboardService.connectionManagementService.connectionInfo.serverInfo.engineEditionId;
		return config.map((item) => {
			if (item.edition === undefined) {
				item.edition = edition;
			}
			return item;
		});
	}

	/**
	 * Adds the context to the passed widgets and returns the new widgets
	 * @param widgets Array of widgets to add context to
	 */
	protected addContext(config: WidgetConfig[]): Array<WidgetConfig> {
		let context = this.context;
		return config.map((item) => {
			if (item.context === undefined) {
				item.context = context;
			}
			return item;
		});
	}

	/**
	 * Validates configs to make sure nothing will error out and returns the modified widgets
	 * @param config Array of widgets to validate
	 */
	protected validateConfig(config: WidgetConfig[]): Array<WidgetConfig> {
		return config.map((widget) => {
			if (widget.gridItemConfig === undefined) {
				widget.gridItemConfig = {};
			}
			return widget;
		});
	}
}
