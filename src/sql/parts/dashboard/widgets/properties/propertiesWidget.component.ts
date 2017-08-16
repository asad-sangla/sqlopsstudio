/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Component, Inject, forwardRef, ChangeDetectorRef, OnInit, ElementRef, OnDestroy, ViewChild } from '@angular/core';

import { DashboardWidget, IDashboardWidget, WidgetConfig, WIDGET_CONFIG } from 'sql/parts/dashboard/common/dashboardWidget';
import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { toDisposableSubscription } from 'sql/parts/common/rxjsUtils';

import { properties } from './propertiesJson';

import { DatabaseInfo, ServerInfo } from 'data';

import { IDisposable } from 'vs/base/common/lifecycle';
import { EventType, addDisposableListener } from 'vs/base/browser/dom';

export interface PropertiesConfig {
	properties: Array<Property>;
}

export interface FlavorProperties {
	flavor: string;
	condition?: {
		field: string;
		operator: '==' | '<=' | '>=' | '!=';
		value: string;
	};
	databaseProperties: Array<Property>;
	serverProperties: Array<Property>;
}

export interface ProviderProperties {
	provider: string;
	flavors: Array<FlavorProperties>;
}

export interface Property {
	displayName: string;
	value: string;
	ignore?: Array<string>;
	default?: Array<string>;
}

export interface DisplayProperty {
	displayName: string;
	value: string;
}

@Component({
	selector: 'properties-widget',
	templateUrl: require.toUrl('sql/parts/dashboard/widgets/properties/propertiesWidget.component.html'),
	styleUrls: [require.toUrl('sql/parts/dashboard/media/dashboard.css'), require.toUrl('sql/media/primeng.css')]
})
export class PropertiesWidgetComponent extends DashboardWidget implements IDashboardWidget, OnInit, OnDestroy {
	private _connection: ConnectionManagementInfo;
	private _databaseInfo: DatabaseInfo;
	private _clipped: boolean;
	private _disposables: Array<IDisposable> = [];
	private properties: Array<DisplayProperty>;
	private _hasInit = false;

	@ViewChild('child', { read: ElementRef }) private _child: ElementRef;
	@ViewChild('parent', { read: ElementRef }) private _parent: ElementRef;

	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeRef: ChangeDetectorRef,
		@Inject(forwardRef(() => ElementRef)) private _el: ElementRef,
		@Inject(WIDGET_CONFIG) protected _config: WidgetConfig,
		consoleError?: ((message?: any, ...optionalParams: any[]) => void)
	) {
		super();
		if (consoleError) {
			this.consoleError = consoleError;
		}
		let self = this;
		this._connection = this._bootstrap.connectionManagementService.connectionInfo;
		if (!self._connection.serverInfo.isCloud) {
			self._disposables.push(toDisposableSubscription(self._bootstrap.adminService.databaseInfo.subscribe(data => {
				self._databaseInfo = data;
				_changeRef.detectChanges();
				self.parseProperties();
				if (self._hasInit) {
					self.handleClipping();
				}
			})));
		} else {
			self._databaseInfo = {
				options: {}
			};
			self.parseProperties();
			if (this._hasInit) {
				this.handleClipping();
			}
		}
	}

	ngOnInit() {
		this._hasInit = true;
		this._disposables.push(addDisposableListener(window, EventType.RESIZE, () => this.handleClipping()));
		this._changeRef.detectChanges();
	}

	ngOnDestroy() {
		this._disposables.forEach(i => i.dispose());
	}

	private handleClipping(): void {
		if (this._child.nativeElement.offsetWidth > this._parent.nativeElement.offsetWidth) {
			this._clipped = true;
		} else {
			this._clipped = false;
		}
		this._changeRef.detectChanges();
	}

	private parseProperties() {
		let provider = this._config.provider;

		let propertyArray: Array<Property>;

		// if config exists use that, otherwise use default
		if (this._config.widget['properties-widget'] && this._config.widget['properties-widget'].properties) {
			let config = <PropertiesConfig>this._config.widget['properties-widget'];
			propertyArray = config.properties;
		} else {
			let propertiesConfig: Array<ProviderProperties> = properties;
			// ensure we have a properties file
			if (!Array.isArray(propertiesConfig)) {
				this.consoleError('Could not load properties JSON');
				return;
			}

			// filter the properties provided based on provider name
			let providerPropertiesArray = propertiesConfig.filter((item) => {
				return item.provider === provider;
			});

			// Error handling on provider
			if (providerPropertiesArray.length === 0) {
				this.consoleError('Could not locate properties for provider: ', provider);
				return;
			} else if (providerPropertiesArray.length > 1) {
				this.consoleError('Found multiple property definitions for provider ', provider);
				return;
			}

			let providerProperties = providerPropertiesArray[0];

			let flavor: FlavorProperties;

			// find correct flavor
			if (providerProperties.flavors.length === 1) {
				flavor = providerProperties.flavors[0];
			} else if (providerProperties.flavors.length === 0) {
				this.consoleError('No flavor definitions found for "', provider,
					'. If there are not multiple flavors of this provider, add one flavor without a condition');
				return;
			} else {
				let flavorArray = providerProperties.flavors.filter((item) => {
					let condition = this._connection.serverInfo[item.condition.field];
					switch (item.condition.operator) {
						case '==':
							return condition === item.condition.value;
						case '!=':
							return condition !== item.condition.value;
						case '>=':
							return condition >= item.condition.value;
						case '<=':
							return condition <= item.condition.value;
						default:
							this.consoleError('Could not parse operator: "', item.condition.operator,
								'" on item "', item, '"');
							return false;
					}
				});

				if (flavorArray.length === 0) {
					this.consoleError('Could not determine flavor');
					return;
				} else if (flavorArray.length > 1) {
					this.consoleError('Multiple flavors matched correctly for this provider', provider);
					return;
				}

				flavor = flavorArray[0];
			}

			// determine what context we should be pulling from
			if (this._config.context === 'database') {
				if (!Array.isArray(flavor.databaseProperties)) {
					this.consoleError('flavor', flavor.flavor, ' does not have a definition for database properties');
				}

				if (!Array.isArray(flavor.serverProperties)) {
					this.consoleError('flavor', flavor.flavor, ' does not have a definition for server properties');
				}

				propertyArray = flavor.databaseProperties;
			} else {
				if (!Array.isArray(flavor.serverProperties)) {
					this.consoleError('flavor', flavor.flavor, ' does not have a definition for server properties');
				}

				propertyArray = flavor.serverProperties;
			}
		}


		let infoObject: ServerInfo | {};
		if (this._config.context === 'database') {
			if (this._databaseInfo && this._databaseInfo.options) {
				infoObject = this._databaseInfo.options;
			}
		} else {
			infoObject = this._connection.serverInfo;
		}

		// iterate over properties and display them
		this.properties = [];
		for (let i = 0; i < propertyArray.length; i++) {
			let property = propertyArray[i];
			let assignProperty = {};
			let propertyObject = infoObject[property.value];

			// if couldn't find, set as default value
			if (propertyObject === undefined) {
				propertyObject = property.default || '--';
			}

			// make sure the value we got shouldn't be ignored
			if (property.ignore !== undefined && propertyObject !== '--') {
				for (let j = 0; j < property.ignore.length; j++) {
					// set to default value if we should be ignoring it's value
					if (propertyObject === property.ignore[0]) {
						propertyObject = property.default || '--';
						break;
					}
				}
			}
			assignProperty['displayName'] = property.displayName;
			assignProperty['value'] = propertyObject;
			this.properties.push(<DisplayProperty>assignProperty);
		}

		if (this._hasInit) {
			this._changeRef.detectChanges();
		}
	}

	// overwrittable console.error for testing
	private consoleError(message?: any, ...optionalParams: any[]): void {
		console.error(message, optionalParams);
	}
}