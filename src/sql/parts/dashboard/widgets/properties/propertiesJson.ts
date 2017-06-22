/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ProviderProperties } from './propertiesWidget.component';
import * as nls from 'vs/nls';

export const properties: Array<ProviderProperties> = [
	{
		provider: 'MSSQL',
		flavors: [
			{
				flavor: 'on_prem',
				condition: {
					field: 'isCloud',
					operator: '!=',
					value: 'true'
				},
				databaseProperties: [
					{
						name: nls.localize('status', 'Status'),
						value: [
							'databaseState'
						]
					},
					{
						name: nls.localize('recoveryModel', 'Recovery Model'),
						value: [
							'recoveryModel'
						]
					},
					{
						name: nls.localize('lastDatabaseBackup', 'Last Database Backup'),
						value: [
							'lastBackupDate'
						],
						ignore: [
							'1/1/0001 12:00:00 AM'
						]
					},
					{
						name: nls.localize('lastLogBackup', 'Last Log Backup'),
						value: [
							'lastLogBackupDate'
						],
						ignore: [
							'1/1/0001 12:00:00 AM'
						]
					},
					{
						name: nls.localize('compatabilityLevel', 'Compatability Level'),
						value: [
							'compatibilityLevel'
						]
					},
					{
						name: nls.localize('owner', 'Owner'),
						value: [
							'owner'
						]
					}
				],
				serverProperties: [
					{
						name: nls.localize('version', 'Version'),
						value: [
							'serverVersion'
						]
					},
					{
						name: nls.localize('edition', 'Edition'),
						value: [
							'serverEdition'
						]
					},
					{
						name: nls.localize('computerName', 'Computer Name'),
						value: [
							'machineName'
						]
					},
					{
						name: nls.localize('osVersion', 'OS Version'),
						value: [
							'osVersion'
						]
					}
				]
			}
		]
	}
];