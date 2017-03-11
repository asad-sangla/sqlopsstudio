/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import data = require('data');

export const SERVICE_ID = 'metadataService';

export const IMetadataService = createDecorator<IMetadataService>(SERVICE_ID);

export interface IMetadataService {
	_serviceBrand: any;

	getMetadata(providerId: string, connectionUri: string): Thenable<data.ProviderMetadata>;

	/**
	 * Register a metadata provider
	 */
	registerProvider(providerId: string, provider: data.MetadataProvider): void;
}

export class MetadataService implements IMetadataService {

	public _serviceBrand: any;

	private disposables: IDisposable[] = [];

	private _providers: { [handle: string]: data.MetadataProvider; } = Object.create(null);

	constructor() {
	}

	public getMetadata(providerId: string, connectionUri: string): Thenable<data.ProviderMetadata> {
		let provider = this._providers[providerId];
		if (provider) {
			return provider.getMetadata(connectionUri);
		}

		return Promise.resolve(undefined);
	}

	/**
	 * Register a metadata provider
	 */
	public registerProvider(providerId: string, provider: data.MetadataProvider): void {
		this._providers[providerId] = provider;
	}

	public dispose(): void {
		this.disposables = dispose(this.disposables);
	}
}
