/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IConfigurationRegistry, Extensions, IConfigurationNode } from 'vs/platform/configuration/common/configurationRegistry';
import { Registry } from 'vs/platform/registry/common/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';

const configurationRegistry = Registry.as<IConfigurationRegistry>(Extensions.Configuration);

export const SERVER_GROUP_CONFIG = 'serverGroup';
export const SERVER_GROUP_COLORS_CONFIG = 'colors';

const serverGroupConfig: IConfigurationNode = {
	id: 'Server Groups',
	type: 'object',
	properties: {
		[SERVER_GROUP_CONFIG + '.' + SERVER_GROUP_COLORS_CONFIG]: <IJSONSchema>{
			type: 'array',
			items: 'string',
			default: [
				'#515151',
				'#004760',
				'#771b00',
				'#700060',
				'#a17d01',
				'#006749',
				'#654502',
				'#3A0293'
			]
		}
	}
};

configurationRegistry.registerConfiguration(serverGroupConfig);