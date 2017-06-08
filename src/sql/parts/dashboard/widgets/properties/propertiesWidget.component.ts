/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, ElementRef, OnDestroy } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

import { BackupConfigInfo } from 'data';

interface Property {
	title: string;
	value: () => string;
	show?: () => boolean;
}

@Component({
	selector: 'properties-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/properties/propertiesWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class PropertiesWidgetComponent extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {
	private _connection: ConnectionManagementInfo;
	private _databaseInfo: BackupConfigInfo;
	private _clipped: boolean;
	private _eventHandler: () => any;
	private _parent;
	private _child;
	private properties: Property[] = [
		{
			title: 'Version',
			value: () => {
				return this._connection.serverInfo.serverVersion || '--';
			},
			show: () => {
				return this._connection !== undefined && this._config.context === 'server';
			}
		},
		{
			title: 'Edition',
			value: () => {
				return this._connection.serverInfo.serverEdition || '--';
			},
			show: () => {
				return this._connection !== undefined && this._config.context === 'server';
			}
		},
		{
			//TODO
			title: 'Computer Name',
			value: () => {
				return this._connection.serverInfo['Computer Name'] || '--';
			},
			show: () => {
				return this._connection !== undefined && this._config.context === 'server';
			}
		},
		{
			title: 'OS Version',
			value: () => {
				return this._connection.serverInfo.osVersion || '--';
			},
			show: () => {
				return this._connection !== undefined && this._config.context === 'server';
			}
		},
		{
			title: 'Compatibility Level',
			value: () => {
				return this._connection.serverInfo.serverLevel || '--';
			},
			show: () => {
				return this._connection !== undefined && this._config.context === 'server';
			}
		},
		{
			title: 'Status',
			value: () => {
				return this._databaseInfo.databaseInfo['options']['databaseState'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			//TODO
			title: 'Recovery Model',
			value: () => {
				return this._databaseInfo.databaseInfo['options']['recoveryModel'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			//TODO
			title: 'Last Database Backup',
			value: () => {
				return this._databaseInfo.databaseInfo['options']['lastBackup'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			//TODO
			title: 'Last Log Backup',
			value: () => {
				return this._databaseInfo.databaseInfo['options']['lastLog'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Compatability Level',
			value: () => {
				return this._connection.serverInfo.serverLevel || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Owner',
			value: () => {
				return this._databaseInfo.databaseInfo['options']['owner'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		}
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef
	) {
		super();
		let self = this;
		self._bootstrap.connectionInfo.then((data) => {
			self._connection = data;
			_changeRef.detectChanges();
			if (!self._connection.serverInfo.isCloud) {
				self._bootstrap.databaseInfo.then((data) => {
					self._databaseInfo = data;
					_changeRef.detectChanges();
				});
			}
		});
	}

	ngOnInit() {
		this._parent = $(this._el.nativeElement).find('#parent')[0];
		this._child = $(this._el.nativeElement).find('#child')[0];
		this._eventHandler = this.handleClipping();
		$( window ).on('resize', this._eventHandler);
	}

	ngOnDestroy() {
		$( window ).off('resize', this._eventHandler);
	}

	public handleClipping(): () => any {
		let self = this;
		return () => {
			if (self._child.offsetWidth > self._parent.offsetWidth) {
				self._clipped = true;
				self._changeRef.detectChanges();
			} else {
				self._clipped = false;
				self._changeRef.detectChanges();
			}
		};
	}

	public load(config: WidgetConfig): boolean {
		this._config = config;
		return true;
	}
}