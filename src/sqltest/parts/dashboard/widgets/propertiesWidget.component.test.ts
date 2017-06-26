/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ChangeDetectorRef } from '@angular/core';

import { WidgetConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface, SingleAdminService, SingleConnectionManagementService } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';

import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

class TestChangeDetectorRef extends ChangeDetectorRef {
	reattach(): void {
		return;
	}
	checkNoChanges(): void {
		return;
	}
	detectChanges(): void {
		return;
	}
	detach(): void {
		return;
	}
	markForCheck(): void {
		return;
	}
}

suite('Dashboard Properties Widget Tests', () => {
	test('Parses good config', (done) => {
		let propertiesConfig = {
			properties: [
				{
					provider: 'MSSQL',
					flavors: [
						{
							flavor: 'blank',
							condition: {
								field: 'isCloud',
								operator: '!=',
								value: 'true'
							},
							databaseProperties: [
								{
									name: 'Test',
									value: [
										'testProperty'
									]
								}
							],
							serverProperties: [
								{
									name: 'Test',
									value: [
										'testProperty'
									]
								}
							]
						}
					]
				}
			]
		};

		let serverInfo = {
			isCloud: false,
			testProperty: 'Test Property',
			serverMajorVersion: undefined,
			serverMinorVersion: undefined,
			serverReleaseVersion: undefined,
			engineEditionId: undefined,
			serverVersion: undefined,
			serverLevel: undefined,
			serverEdition: undefined,
			azureVersion: undefined,
			osVersion: undefined,
		};

		let databaseInfo = {
			options: {
				testProperty: 'Test Property'
			}
		};

		let widgetConfig: WidgetConfig = {
			selector: 'properties-widget',
			context: 'server',
			config: propertiesConfig
		};

		let dashboardService = TypeMoq.Mock.ofType(DashboardServiceInterface, TypeMoq.MockBehavior.Loose, [{}]);

		let singleAdminService = TypeMoq.Mock.ofType(SingleAdminService);
		singleAdminService.setup(x => x.databaseInfo).returns(() => Promise.resolve(databaseInfo));

		dashboardService.setup(x => x.adminService).returns(() => singleAdminService.object);

		let connectionprofile = TypeMoq.Mock.ofType(ConnectionProfile);
		connectionprofile.object.providerName = 'MSSQL';

		let connectionManagementinfo = TypeMoq.Mock.ofType(ConnectionManagementInfo);
		connectionManagementinfo.object.serverInfo = serverInfo;
		connectionManagementinfo.object.connectionProfile = connectionprofile.object;

		let singleConnectionService = TypeMoq.Mock.ofType(SingleConnectionManagementService);
		singleConnectionService.setup(x => x.connectionInfo).returns(() => connectionManagementinfo.object);

		dashboardService.setup(x => x.connectionManagementService).returns(() => singleConnectionService.object);

		let consoleError = (message?: any, ...optionalParams: any[]): void => {
			assert.fail('Called console Error unexpectedly');
		};

		let testComponent = new PropertiesWidgetComponent(dashboardService.object, new TestChangeDetectorRef(), undefined, widgetConfig, consoleError);

		// because config parsing is done async we need to put our asserts on the thread stack
		setTimeout(() => {
			// because properties is private we need to do some work arounds to access it.
			assert.equal((<any> testComponent).properties.length, 1);
			assert.equal((<any> testComponent).properties[0].name, 'Test');
			assert.equal((<any> testComponent).properties[0].value, 'Test Property');
			done();
		});
	});
});