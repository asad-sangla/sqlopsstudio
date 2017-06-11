/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Component, Input, Inject, forwardRef, ComponentFactoryResolver, AfterContentInit, ViewChild,
	ElementRef, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { ThemeUtilities } from 'sql/common/themeUtilities';

import { WidgetDirective } from './widget.directive';
import { IDashboardWidget, WidgetConfig } from './dashboardWidget';
import { PathUtilities } from 'sql/common/pathUtilities';

/* Widgets */
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ExplorerWidget } from 'sql/parts/dashboard/widgets/explorer/explorerWidget.component';
import { TasksWidget } from 'sql/parts/dashboard/widgets/tasks/tasksWidget.component';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

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
export class DashboardWidgetWrapper implements AfterContentInit, OnInit, OnDestroy {
	@Input() private _config: WidgetConfig;
	private _themeSub: Subscription;

	@ViewChild(WidgetDirective) widgetHost: WidgetDirective;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ElementRef)) private _ref: ElementRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef
	) { }

	ngOnInit() {
		let self = this;
		self._themeSub = self._bootstrap.onThemeChange((event: IColorTheme) => {
			self.updateTheme(event);
		});
	}

	ngAfterContentInit() {
		this.updateTheme(this._bootstrap.theme);
		this.loadWidget();
	}

	ngOnDestroy() {
		this._themeSub.unsubscribe();
	}

	private loadWidget(): void {
		let componentFactory = this._componentFactoryResolver.resolveComponentFactory(componentMap[this._config.selector]);

		let viewContainerRef = this.widgetHost.viewContainerRef;
		viewContainerRef.clear();

		let componentRef = viewContainerRef.createComponent(componentFactory);
		let el = <HTMLElement> componentRef.location.nativeElement;

		// set widget styles to conform to its box
		el.style.overflow = 'hidden';
		el.style.flex = '1 1 auto';
		el.style.position = 'relative';

		if (!(<IDashboardWidget>componentRef.instance).load(this._config)) {
			console.log('failed to load widget ' + this._config.selector);
		}
	}

	private updateTheme(theme: IColorTheme): void {
		let el = <HTMLElement> this._ref.nativeElement;
		let borderColor = theme.getColor('sideBar.background', true);
		let backgroundColor = theme.getColor('editor.background', true);
		let foregroundColor = theme.getColor('sideBar.foreground', true);
		// TODO: highContrastBorder does not exist, how to handle?
		let border = theme.getColor('highContrastBorder', true);

		if (this._config.background_color) {
			backgroundColor = theme.getColor(this._config.background_color);
		}

		if (this._config.border === 'none') {
			borderColor = undefined;
		}

		if (ThemeUtilities.isLightTheme(theme) && this._config.icon) {
			this._config.loadedIcon = PathUtilities.toUrl(this._config.inverse_icon);
			this._changeref.detectChanges();
		} else if (ThemeUtilities.isDarkTheme(theme) && this._config.inverse_icon) {
			this._config.loadedIcon = PathUtilities.toUrl(this._config.inverse_icon);
			this._changeref.detectChanges();
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