/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import data = require('data');
import Event, { Emitter } from 'vs/base/common/event';

export const SERVICE_ID = 'capabilitiesService';
export const HOST_NAME = 'carbon';
export const HOST_VERSION = '1.0';

export const ICapabilitiesService = createDecorator<ICapabilitiesService>(SERVICE_ID);

/**
 * Interface for managing provider capabilities
 */
export interface ICapabilitiesService {
	_serviceBrand: any;

	/**
	 * Retrieve a list of registered capabilities providers
	 */
	getCapabilities(): data.DataProtocolServerCapabilities[];

	/**
	 * Register a capabilities provider
	 */
	registerProvider(provider: data.CapabilitiesProvider): void;

	/**
	 * Event raised when a provider is registered
	 */
	onProviderRegisteredEvent: Event<data.DataProtocolServerCapabilities>;

}

/**
 * Capabilities service implementation class.  This class provides the ability
 * to discover the DMP capabilties that a DMP provider offers.
 */
export class CapabilitiesService implements ICapabilitiesService {

	public _serviceBrand: any;

	private _providers: data.CapabilitiesProvider[] = [];

	private _capabilities: data.DataProtocolServerCapabilities[] = [];

	private _onProviderRegistered : Emitter<data.DataProtocolServerCapabilities>;

	private  _clientCapabilties: data.DataProtocolClientCapabilities = {

		hostName: HOST_NAME,
        hostVersion: HOST_VERSION
	};

	private disposables: IDisposable[] = [];

	constructor() {
		this._onProviderRegistered = new Emitter<data.DataProtocolServerCapabilities>();
		this.disposables.push(this._onProviderRegistered);
	}

	/**
	 * Retrieve a list of registered server capabilities
	 */
	public getCapabilities(): data.DataProtocolServerCapabilities[] {
		return this._capabilities;
	}

	/**
	 * Register the capabilities provider and query the provider for its capabilities
	 * @param provider
	 */
	public registerProvider(provider: data.CapabilitiesProvider): void {
		this._providers.push(provider);

		// request the capabilities from server
		provider.getServerCapabilities(this._clientCapabilties).then(serverCapabilities => {
			this._capabilities.push(serverCapabilities);
			this._onProviderRegistered.fire(serverCapabilities);
		});
	}

	// Event Emitters
	public get onProviderRegisteredEvent(): Event<data.DataProtocolServerCapabilities> {
		return this._onProviderRegistered.event;
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}