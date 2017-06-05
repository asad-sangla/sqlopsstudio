/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef, ChangeDetectorRef } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

@Component({
	selector: 'properties-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/properties/propertiesWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class PropertiesWidgetComponent extends DashboardWidget implements IDashboardWidget {
	private _connection: ConnectionManagementInfo;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef
	) {
		super();
		this._bootstrap.connectionInfo.then((data) => {
			this._connection = data;
			_changeRef.detectChanges();
		});
	}

	public load(config: WidgetConfig): boolean {
		this._config = config;
		return true;
	}
}