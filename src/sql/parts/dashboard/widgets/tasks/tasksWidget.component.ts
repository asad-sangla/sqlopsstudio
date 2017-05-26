/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DashboardWidget, IDashboardWidget, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { BootstrapServiceWrapper } from 'sql/parts/dashboard/services/bootstrapServiceWrapper.service';

export interface Task {
	name: string;
	action: () => void;
	icon?: string;
	context?: string;
	internal_icon?: SafeResourceUrl;
}

@Component({
	selector: 'tasks-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/tasks/tasksWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class TasksWidget extends DashboardWidget implements IDashboardWidget {
	private _size: number = 108;
	private _margins: number = 5;
	private _rows: number = 2;
	//tslint:disable-next-line
	private tasks: Task[] = [
		{
			name: 'New Query',
			action: () => {
				this.newQuery();
			},
			icon: require.toUrl('sql/media/icons/file_inverse.svg')
		},
		{
			name: 'Create Database',
			action: () => {
				this.createDatabase();
			},
			icon: require.toUrl('sql/media/icons/new_database_inverse.svg')
		},
		{
			name: 'Backup',
			action: () => {
				this.backup();
			},
			context: 'database',
			icon: require.toUrl('sql/media/icons/backup_inverse.svg')
		}
	];

	constructor(
		@Inject(forwardRef(() => BootstrapServiceWrapper)) private _bootstrap: BootstrapServiceWrapper,
		@Inject(forwardRef(() => DomSanitizer)) private _sanitizer: DomSanitizer
	) {
		super();
		for (let task of this.tasks) {
			if (task.icon) {
				task.internal_icon = this._sanitizer.bypassSecurityTrustStyle('url(' + task.icon + ') center center no-repeat');
			}
		}
	}

	public load(config: WidgetConfig): boolean {
		this._config = config;
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
		let marginy = (((index % this._rows) + 1) * this._margins);
		let marginx = (this._margins * (1 + (Math.floor(index / 2))));
		let posx = ((this._size * (Math.floor(index / 2))) + marginx);
		let posy = ((this._size * (index % this._rows)) + marginy);
		return 'translate(' + posx + 'px, ' + posy  + 'px)';
	}
}
