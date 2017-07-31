/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerTask } from 'sql/platform/tasks/taskRegistry';
import * as Actions from './actions';

import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';

const backupSchema: IJSONSchema = {
	description: nls.localize('carbon.actions.back', 'Open up backup dialog'),
	type: 'null',
	default: null
};

const restoreSchema: IJSONSchema = {
	description: nls.localize('carbon.actions.restore', 'Open up restore dialog'),
	type: 'null',
	default: null
};

const newQuerySchema: IJSONSchema = {
	description: nls.localize('carbon.actions.newQuery', 'Open a new query window'),
	type: 'null',
	default: null
};

const newDatabaseSchema: IJSONSchema = {
	description: nls.localize('carbon.actions.newDatabase', 'Open up new database Dialog'),
	type: 'null',
	default: null
};

registerTask('backup', '', backupSchema, Actions.BackupAction);
registerTask('restore', '', restoreSchema, Actions.RestoreAction);
registerTask('new-query', '', newQuerySchema, Actions.NewQueryAction);
registerTask('new-database', '', newDatabaseSchema, Actions.NewDatabaseAction);