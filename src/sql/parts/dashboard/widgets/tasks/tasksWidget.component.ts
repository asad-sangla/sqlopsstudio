/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

/* Node Modules */
import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/* SQL imports */
import { ThemeUtilities } from 'sql/common/themeUtilities';
import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

/* VS imports */
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { IDisposable } from 'vs/base/common/lifecycle';

import { PathUtilities } from 'sql/common/pathUtilities';

export interface Task {
	name: string;
	action: () => void;
	icon?: string;
	inverse_icon?: string;
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
	private isDarkTheme: boolean;
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
			icon: PathUtilities.toUrl('sql/media/icons/file.svg'),
			inverse_icon: PathUtilities.toUrl('sql/media/icons/file_inverse.svg')
		},
		{
			name: 'Create Database',
			action: () => {
				this.createDatabase();
			},
			icon: PathUtilities.toUrl('sql/media/icons/new_database.svg'),
			inverse_icon: PathUtilities.toUrl('sql/media/icons/new_database_inverse.svg')
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
			icon: PathUtilities.toUrl('sql/media/icons/backup.svg'),
			inverse_icon: PathUtilities.toUrl('sql/media/icons/backup_inverse.svg')
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
		this.isDarkTheme = !ThemeUtilities.isDarkTheme(theme);
		self.updateTheme(theme);
	}

	ngOnDestroy() {
		this._themeDispose.dispose();
	}

	private updateTheme(e: IColorTheme): void {
		if (ThemeUtilities.isDarkTheme(e) && !this.isDarkTheme) {
			this.isDarkTheme = true;
			for (let task of this.tasks) {
				if (task.icon) {
					task.internal_icon = task.inverse_icon;
				}
			}
		} else if(ThemeUtilities.isDarkTheme(e) && this.isDarkTheme) {
			this.isDarkTheme = false;
			for (let task of this.tasks) {
				if (task.icon) {
					task.internal_icon = task.icon;
				}
			}
		}
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
