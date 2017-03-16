/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import data = require('data');
import * as interfaces from 'sql/parts/connection/node/interfaces';
import { ConnectionOptionSpecialType } from 'sql/parts/connection/common/connectionManagement';

export class ProviderConnectionInfo implements data.ConnectionInfo {

	options: { [name: string]: string };

	providerName: string;
	protected _optionsMetadata: data.DataProtocolServerCapabilities;

	public constructor(optionsMetadata?: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		this.load(optionsMetadata, model);
	}

	public load(optionsMetadata: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		this.options = {};
		if (optionsMetadata) {
			this._optionsMetadata = optionsMetadata;
			this.providerName = optionsMetadata.providerName;
		}
		if (model) {
			this.serverName = model.serverName;
			this.authenticationType = model.authenticationType;
			this.databaseName = model.databaseName;
			this.password = model.password;
			this.userName = model.userName;
		}
	}

	public clone(): ProviderConnectionInfo {
		let instance = new ProviderConnectionInfo(this._optionsMetadata);
		instance.options = Object.assign({}, this.options);
		instance.providerName = this.providerName;
		return instance;
	}

	public setOptionsMetadata(value: data.DataProtocolServerCapabilities) {
		this._optionsMetadata = value;
	}

	public get serverName(): string {
		return this.getSpecialTypeOptionValue(ConnectionOptionSpecialType.serverName);
	}

	public get databaseName(): string {
		return this.getSpecialTypeOptionValue(ConnectionOptionSpecialType.databaseName);
	}

	public get userName(): string {
		return this.getSpecialTypeOptionValue(ConnectionOptionSpecialType.userName);
	}

	public get password(): string {
		return this.getSpecialTypeOptionValue(ConnectionOptionSpecialType.password);
	}

	public get authenticationType(): string {
		return this.getSpecialTypeOptionValue(ConnectionOptionSpecialType.authType);
	}

	public set serverName(value: string) {
		this.setSpecialTypeOptionName(ConnectionOptionSpecialType.serverName, value);
	}

	public set databaseName(value: string) {
		this.setSpecialTypeOptionName(ConnectionOptionSpecialType.databaseName, value);
	}

	public set userName(value: string) {
		this.setSpecialTypeOptionName(ConnectionOptionSpecialType.userName, value);
	}

	public set password(value: string) {
		this.setSpecialTypeOptionName(ConnectionOptionSpecialType.password, value);
	}

	public set authenticationType(value: string) {
		this.setSpecialTypeOptionName(ConnectionOptionSpecialType.authType, value);
	}

	public getOptionValue(name: string): string {
		return this.options[name];
	}

	public setOptionValue(name: string, value: string): void {
		//TODO: validate
		this.options[name] = value;
	}

	private getSpecialTypeOptionValue(type: number): string {
		let name = this.getSpecialTypeOptionName(type);
		if (name) {
			return this.options[name];
		}
		return undefined;
	}

	public getUniqueId(): string {
		let idNames = [];
		if (this._optionsMetadata) {
			idNames = this._optionsMetadata.connectionProvider.options.map(o => {
				if ((o.specialValueType || o.isIdentity) && o.specialValueType !== ConnectionOptionSpecialType.password) {
					return o.name;
				} else {
					return undefined;
				}
			});
		} else {
			idNames = ['0', '1', '2', '3'];
		}

		//Sort to make sure with the ids at the same order every time otherwise the ids would be different
		idNames.sort();

		let idValues: string[] = [];
		for (var index = 0; index < idNames.length; index++) {
			let value = this.options[idNames[index]];
			value = value ? value : '';
			idValues.push(value);
		}

		return this.providerName + '_' + idValues.join('_');
	}

	public getSpecialTypeOptionName(type: number): string {
		if (this._optionsMetadata) {
			let optionMetadata = this._optionsMetadata.connectionProvider.options.find(o => o.specialValueType === type);
			return !!optionMetadata ? optionMetadata.name : undefined;
		} else {
			return type.toString();
		}
	}

	public setSpecialTypeOptionName(type: number, value: string): void {
		let name = this.getSpecialTypeOptionName(type);
		if (!!name) {
			this.options[name] = value;
		}
	}
}

