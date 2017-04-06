/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import data = require('data');
import * as interfaces from 'sql/parts/connection/common/interfaces';
import { ConnectionOptionSpecialType, ConnectionOptionType } from 'sql/parts/connection/common/connectionManagement';

export class ProviderConnectionInfo implements data.ConnectionInfo {

	options: { [name: string]: any };

	providerName: string;
	protected _serverCapabilities: data.DataProtocolServerCapabilities;
	private static readonly MsSqlProviderName: string = 'MSSQL';
	private static readonly SqlAuthentication = 'SqlLogin';

	public constructor(serverCapabilities?: data.DataProtocolServerCapabilities, model?: interfaces.IConnectionProfile) {
		this.options = {};
		if (serverCapabilities) {
			this._serverCapabilities = serverCapabilities;
			this.providerName = serverCapabilities.providerName;
		}
		if (model) {
			if (model.options && this._serverCapabilities) {
				this._serverCapabilities.connectionProvider.options.forEach(option => {
					let value = model.options[option.name];
					this.options[option.name] = value;
				});
			}
			this.serverName = model.serverName;
			this.authenticationType = model.authenticationType;
			this.databaseName = model.databaseName;
			this.password = model.password;
			this.userName = model.userName;
		}
	}

	public clone(): ProviderConnectionInfo {
		let instance = new ProviderConnectionInfo(this._serverCapabilities);
		instance.options = Object.assign({}, this.options);
		instance.providerName = this.providerName;
		return instance;
	}

	public setServerCapabilities(value: data.DataProtocolServerCapabilities) {
		this._serverCapabilities = value;
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

	public getOptionValue(name: string): any {
		return this.options[name];
	}

	public setOptionValue(name: string, value: any): void {
		//TODO: validate
		this.options[name] = value;
	}

	public isPasswordRequired(): boolean {
		let optionMetadata = this._serverCapabilities.connectionProvider.options.find(
			option => option.specialValueType === ConnectionOptionSpecialType.password);
		let isPasswordRequired: boolean = optionMetadata.isRequired;
		if (this.providerName === ProviderConnectionInfo.MsSqlProviderName) {
			isPasswordRequired = this.authenticationType === ProviderConnectionInfo.SqlAuthentication && optionMetadata.isRequired;
		}
		return isPasswordRequired;
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
		if (this._serverCapabilities) {
			idNames = this._serverCapabilities.connectionProvider.options.map(o => {
				if ((o.specialValueType || o.isIdentity) && o.specialValueType !== ConnectionOptionSpecialType.password) {
					return o.name;
				} else {
					return undefined;
				}
			});
		} else {
			// This should never happen but just incase the serverCapabilities was not ready at this time
			idNames = ['authenticationType', 'database', 'server', 'user'];
		}

		idNames = idNames.filter(x => x !== undefined);

		//Sort to make sure using names in the same order every time otherwise the ids would be different
		idNames.sort();

		let idValues: string[] = [];
		for (var index = 0; index < idNames.length; index++) {
			let value = this.options[idNames[index]];
			value = value ? value : '';
			idValues.push(`${idNames[index]}${ProviderConnectionInfo.nameValueSeparator}${value}`);
		}

		return 'providerName' + ProviderConnectionInfo.nameValueSeparator +
		this.providerName + ProviderConnectionInfo.idSeparator + idValues.join(ProviderConnectionInfo.idSeparator);
	}

	public getSpecialTypeOptionName(type: number): string {
		if (this._serverCapabilities) {
			let optionMetadata = this._serverCapabilities.connectionProvider.options.find(o => o.specialValueType === type);
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

	public get authenticationTypeDisplayName(): string {
		let optionMetadata = this._serverCapabilities.connectionProvider.options.find(o => o.specialValueType === ConnectionOptionSpecialType.authType);
		let authType = this.authenticationType;
		let displayName: string = authType;

		if (optionMetadata && optionMetadata.categoryValues) {
			optionMetadata.categoryValues.forEach(element => {
				if (element.name === authType) {
					displayName = element.displayName;
				}
			});
		}
		return displayName;
	}

	public getProviderOptions(): data.ConnectionOption[] {
		return this._serverCapabilities.connectionProvider.options;
	}

	public static get idSeparator(): string {
		return '|';
	}

	public static get nameValueSeparator(): string {
		return ':';
	}

	public get titleParts(): string[] {
		let parts: string[] = [];
		// Always put these three on top. TODO: maybe only for MSSQL?
		parts.push(this.serverName);
		parts.push(this.databaseName);
		parts.push(this.authenticationTypeDisplayName);

		this._serverCapabilities.connectionProvider.options.forEach(element => {
			if (element.specialValueType !== ConnectionOptionSpecialType.serverName &&
			element.specialValueType !== ConnectionOptionSpecialType.databaseName &&
			element.specialValueType !== ConnectionOptionSpecialType.authType &&
			element.specialValueType !== ConnectionOptionSpecialType.password &&
			element.isIdentity && element.valueType === ConnectionOptionType.string) {
				let value = this.getOptionValue(element.name);
				if (value) {
					parts.push(value);
				}
			}
		});

		return parts;
	}
}

