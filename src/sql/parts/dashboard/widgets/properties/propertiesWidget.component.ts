/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { BootstrapServiceWrapper } from 'sql/parts/dashboard/services/bootstrapServiceWrapper.service';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

@Component({
	selector: 'properties-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/properties/propertiesWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class PropertiesWidgetComponent extends DashboardWidget implements IDashboardWidget {
	private _connection: ConnectionManagementInfo;

	constructor(
		@Inject(forwardRef(() => BootstrapServiceWrapper)) private _bootstrap: BootstrapServiceWrapper
	) {
		super();
		this._bootstrap.bootstrapParams.then((data) => {
			this._connection = data.connection;
		});
	}

	public load(config: WidgetConfig): boolean {
		this._config = config;
		return true;
	}
}