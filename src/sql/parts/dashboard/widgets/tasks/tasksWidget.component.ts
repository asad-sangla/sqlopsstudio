/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';

/* Node Modules */
import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/* SQL imports */
import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

/* VS imports */
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IDisposable } from 'vs/base/common/lifecycle';

export interface Task {
	name: string;
	action: () => void;
	iconClass?: string;
	context?: string;
	internal_icon?: SafeResourceUrl;
	show_condition?: () => boolean;
}

@Component({
	selector: 'tasks-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/tasks/tasksWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class TasksWidget extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {
	private _size: number = 100;
	private _margins: number = 10;
	private _rows: number = 2;
	private _isAzure = false;
	private _themeDispose: IDisposable;
	private _tileBackground: string;
	//tslint:disable-next-line
	private tasks: Task[] = [
		{
			name: 'New Query',
			action: () => {
				this.newQuery();
			},
			iconClass: 'file',
		},
		{
			name: 'Create Database',
			action: () => {
				this.createDatabase();
			},
			iconClass: 'new-database',
		},
		{
			name: 'Backup',
			action: () => {
				this.backup();
			},
			context: 'database',
			show_condition: (): boolean => {
				return !this._isAzure;
			},
			iconClass: 'backup'
		}
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => DomSanitizer)) private _sanitizer: DomSanitizer,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig
	) {
		super();
		let self = this;
		let connInfo = self._bootstrap.connectionManagementService.connectionInfo;
		self._isAzure = connInfo.serverInfo.isCloud;
	}

	ngOnInit() {
		let self = this;
		self._themeDispose = self._bootstrap.themeService.onDidColorThemeChange((e: IColorTheme) => {
			self.updateTheme(e);
		});
		let theme = this._bootstrap.themeService.getColorTheme();
		self.updateTheme(theme);
	}

	ngOnDestroy() {
		this._themeDispose.dispose();
	}

	private updateTheme(e: IColorTheme): void {
		this._tileBackground = e.getColor('sideBar.background', true).toString();
		this._changeref.detectChanges();
	}

	private newQuery(): void {
		this._bootstrap.newQuery();
	}

	private createDatabase(): void {
		this._bootstrap.createDatabase();
	}

	private backup(): void {
		this._bootstrap.backup();
	}

	//tslint:disable-next-line
	private calculateTransform(index: number): string {
		let marginy = (1 + (index % this._rows)) * this._margins;
		let marginx = (1 + (Math.floor(index / 2))) * this._margins;
		let posx = (this._size * (Math.floor(index / 2))) + marginx;
		let posy = (this._size * (index % this._rows)) + marginy;
		return 'translate(' + posx + 'px, ' + posy  + 'px)';
	}

	private executeQuery() {
		this._bootstrap.queryManagementService.runQueryAndReturn('select * from sys.objects').then((result) => {
			console.log(result);
		});
	}
}
