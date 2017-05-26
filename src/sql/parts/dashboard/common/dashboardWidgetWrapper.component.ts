/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, forwardRef, ComponentFactoryResolver, AfterContentInit, ViewChild,
	ElementRef } from '@angular/core';

import { WidgetDirective } from './widget.directive';
import { IDashboardWidget, WidgetConfig } from './dashboardWidget';

/* Widgets */
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ExplorerWidget } from 'sql/parts/dashboard/widgets/explorer/explorerWidget.component';
import { TasksWidget } from 'sql/parts/dashboard/widgets/tasks/tasksWidget.component';

const componentMap = {
	'properties-widget': PropertiesWidgetComponent,
	'explorer-widget': ExplorerWidget,
	'tasks-widget': TasksWidget
};

@Component({
	selector: 'dashboard-widget-wrapper',
	templateUrl: require.toUrl('sql/parts/dashboard/common/dashboardWidgetWrapper.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DashboardWidgetWrapper implements AfterContentInit {
	@Input() private _config: WidgetConfig;

	@ViewChild(WidgetDirective) widgetHost: WidgetDirective;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ElementRef)) private _ref: ElementRef
	) { }

	ngAfterContentInit() {
		let ele = <HTMLElement> this._ref.nativeElement;
		ele.style.backgroundColor =  $('#workbench\\.parts\\.activitybar').css('background-color');
		this.loadWidget();
	}

	private loadWidget(): void {
		let componentFactory = this._componentFactoryResolver.resolveComponentFactory(componentMap[this._config.selector]);

		let viewContainerRef = this.widgetHost.viewContainerRef;
		viewContainerRef.clear();

		let componentRef = viewContainerRef.createComponent(componentFactory);
		let el = <HTMLElement> componentRef.location.nativeElement;

		// set widget styles to conform to its box
		el.style.height = '100%';
		el.style.width = '100%';
		el.style.overflow = 'hidden';

		if (this._config.icon) {
			this._config.loadedIcon = require.toUrl(this._config.icon);
		}

		if (!(<IDashboardWidget>componentRef.instance).load(this._config)) {
			console.log('failed to load widget ' + this._config.selector);
		}
	}
}