/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, ElementRef, OnDestroy } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

import { DatabaseInfo } from 'data';

interface Property {
	title: string;
	value: () => string;
	show?: () => boolean;
}

const NEVER_BACKED_UP = '1/1/0001 12:00:00 AM';

@Component({
	selector: 'properties-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/properties/propertiesWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class PropertiesWidgetComponent extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {
	private _connection: ConnectionManagementInfo;
	private _databaseInfo: DatabaseInfo;
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
			title: 'Computer Name',
			value: () => {
				return this._connection.serverInfo['machineName'] || '--';
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
			title: 'Status',
			value: () => {
				return this._databaseInfo.options['databaseState'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Recovery Model',
			value: () => {
				return this._databaseInfo.options['recoveryModel'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Last Database Backup',
			value: () => {
				return (this._databaseInfo.options['lastBackupDate'] === NEVER_BACKED_UP ? '' : this._databaseInfo.options['lastBackupDate']) || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Last Log Backup',
			value: () => {
				return (this._databaseInfo.options['lastLogBackupDate'] === NEVER_BACKED_UP ? '' : this._databaseInfo.options['lastBackupDate']) || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Compatibility Level',
			value: () => {
				return this._databaseInfo.options['compatibilityLevel'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		},
		{
			title: 'Owner',
			value: () => {
				return this._databaseInfo.options['owner'] || '--';
			},
			show: () => {
				return this._databaseInfo !== undefined && this._config.context === 'database';
			}
		}
	];

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig
	) {
		super();
		let self = this;
		this._connection = this._bootstrap.connectionManagementService.connectionInfo;
		if (!self._connection.serverInfo.isCloud) {
			self._bootstrap.adminService.databaseInfo.then((data) => {
				self._databaseInfo = data;
				_changeRef.detectChanges();
			});
		} else {
			self._databaseInfo = {
				options: {}
			};
		}
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
}