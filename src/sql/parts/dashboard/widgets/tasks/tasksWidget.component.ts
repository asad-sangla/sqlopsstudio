/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { PathUtilities } from 'sql/common/pathUtilities';

import { DashboardWidget, IDashboardWidget, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

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
export class TasksWidget extends DashboardWidget implements IDashboardWidget, OnInit {
	private isDarkTheme: boolean;
	private _size: number = 100;
	private _margins: number = 10;
	private _trigger: number = 0;
	private _rows: number = 2;
	private _isAzure = false;
	//tslint:disable-next-line
	private tasks: Task[] = [
		{
			name: 'New Query',
			action: () => {
				this.newQuery();
			},
			icon: require.toUrl('sql/media/icons/file.svg'),
			inverse_icon: require.toUrl('sql/media/icons/file_inverse.svg')
		},
		{
			name: 'Create Database',
			action: () => {
				this.createDatabase();
			},
			icon: require.toUrl('sql/media/icons/new_database.svg'),
			inverse_icon: require.toUrl('sql/media/icons/new_database_inverse.svg')
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
			icon: require.toUrl('sql/media/icons/backup.svg'),
			inverse_icon: require.toUrl('sql/media/icons/backup_inverse.svg')
		}
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => DomSanitizer)) private _sanitizer: DomSanitizer,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef
	) { super(); }

	public ngOnInit(): void {
		let self = this;
		self._bootstrap.onThemeChange((e: IColorTheme) => {
			self.updateIcons(e);
		});
		let theme = this._bootstrap.theme;
		this.isDarkTheme = !theme.isDarkTheme();
		self.updateIcons(theme);
	}

	private updateIcons(e: IColorTheme): void {
		if (e.isDarkTheme() && !this.isDarkTheme) {
			this.isDarkTheme = true;
			for (let task of this.tasks) {
				if (task.icon) {
					task.inverse_icon = task.inverse_icon.replace(' ', '%20');
					task.internal_icon = this._sanitizer.bypassSecurityTrustStyle('url(' + task.inverse_icon  + ') center center no-repeat');
				}
			}
			this._changeref.detectChanges();
		} else if(e.isLightTheme() && this.isDarkTheme) {
			this.isDarkTheme = false;
			for (let task of this.tasks) {
				if (task.icon) {
					task.inverse_icon = task.icon.replace(' ', '%20');
					task.internal_icon = this._sanitizer.bypassSecurityTrustStyle('url(' + task.icon  + ') center center no-repeat');
				}
			}
			this._changeref.detectChanges();
		}
	}

	public load(config: WidgetConfig): boolean {
		let self = this;
		self._config = config;
		self._bootstrap.connectionInfo.then(connection => {
			self._isAzure = connection.serverInfo.isCloud;
			// trigger a refresh on the tasks to account for new info
			self._trigger = self._trigger + 1;
		});
		return true;
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
}
