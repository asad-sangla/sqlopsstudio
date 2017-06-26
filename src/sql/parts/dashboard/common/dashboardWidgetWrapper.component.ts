/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';

import { Component, Input, Inject, forwardRef, ComponentFactoryResolver, AfterContentInit, ViewChild,
	ElementRef, OnInit, ChangeDetectorRef, OnDestroy, ReflectiveInjector, Injector } from '@angular/core';

import { WidgetDirective } from './widget.directive';
import { WidgetConfig, WIDGET_CONFIG } from './dashboardWidget';

/* Widgets */
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ExplorerWidget } from 'sql/parts/dashboard/widgets/explorer/explorerWidget.component';
import { TasksWidget } from 'sql/parts/dashboard/widgets/tasks/tasksWidget.component';
import { InsightsWidget } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';

import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import { IDisposable } from 'vs/base/common/lifecycle';
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import * as colors from 'vs/platform/theme/common/colorRegistry';
import * as themeColors from 'vs/workbench/common/theme';

const componentMap = {
	'properties-widget': PropertiesWidgetComponent,
	'explorer-widget': ExplorerWidget,
	'tasks-widget': TasksWidget,
	'insights-widget': InsightsWidget
};

@Component({
	selector: 'dashboard-widget-wrapper',
	templateUrl: require.toUrl('sql/parts/dashboard/common/dashboardWidgetWrapper.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class DashboardWidgetWrapper implements AfterContentInit, OnInit, OnDestroy {
	@Input() private _config: WidgetConfig;
	private _themeDispose: IDisposable;

	@ViewChild(WidgetDirective) widgetHost: WidgetDirective;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ElementRef)) private _ref: ElementRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef,
		@Inject(forwardRef(() => Injector)) private _injector: Injector
	) { }

	ngOnInit() {
		let self = this;
		self._themeDispose = self._bootstrap.themeService.onDidColorThemeChange((event: IColorTheme) => {
			self.updateTheme(event);
		});
	}

	ngAfterContentInit() {
		this.updateTheme(this._bootstrap.themeService.getColorTheme());
		this.loadWidget();
	}

	ngOnDestroy() {
		this._themeDispose.dispose();
	}

	private loadWidget(): void {
		let componentFactory = this._componentFactoryResolver.resolveComponentFactory(componentMap[this._config.selector]);

		let viewContainerRef = this.widgetHost.viewContainerRef;
		viewContainerRef.clear();

		let injector = ReflectiveInjector.resolveAndCreate([{ provide: WIDGET_CONFIG, useValue: this._config}], this._injector);
		let componentRef = viewContainerRef.createComponent(componentFactory, 0, injector);
		let el = <HTMLElement> componentRef.location.nativeElement;

		// set widget styles to conform to its box
		el.style.overflow = 'hidden';
		el.style.flex = '1 1 auto';
		el.style.position = 'relative';
	}

	private updateTheme(theme: IColorTheme): void {
		let el = <HTMLElement> this._ref.nativeElement;
		let borderColor = theme.getColor(themeColors.SIDE_BAR_BACKGROUND, true);
		let backgroundColor = theme.getColor(colors.editorBackground, true);
		let foregroundColor = theme.getColor(themeColors.SIDE_BAR_FOREGROUND, true);
		// TODO: highContrastBorder does not exist, how to handle?
		let border = theme.getColor(colors.contrastBorder, true);

		if (this._config.background_color) {
			backgroundColor = theme.getColor(this._config.background_color);
		}

		if (this._config.border === 'none') {
			borderColor = undefined;
		}

		if (backgroundColor) {
			el.style.backgroundColor =  backgroundColor.toString();
		}

		if (foregroundColor) {
			el.style.color = foregroundColor.toString();
		}

		if (border) {
			el.style.borderColor = border.toString();
			el.style.borderWidth = '1px';
			el.style.borderStyle = 'solid';
		} else if (borderColor) {
			el.style.border = '3px solid ' + borderColor.toString();
		} else {
			el.style.border = 'none';
		}

	}
}