/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerTask } from 'sql/platform/tasks/taskRegistry';
import * as Actions from './actions';
import { IJSONSchema } from 'vs/base/common/jsonSchema';

let actionSchema: IJSONSchema = {
	type: 'object',
	properties: {
		databaseName: {
			type: 'string'
		},
		serverName: {
			type: 'string'
		},
		userName: {
			type: 'string'
		}
	}
};

registerTask('backup', '', actionSchema, Actions.BackupAction);
