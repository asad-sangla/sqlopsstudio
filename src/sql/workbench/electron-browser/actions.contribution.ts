/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { registerTask } from 'sql/platform/tasks/taskRegistry';
import * as Actions from './actions';

registerTask('backup', '', Actions.BackupAction);
registerTask('restore', '', Actions.RestoreAction);
registerTask('new-query', '', Actions.NewQueryAction);
registerTask('new-database', '', Actions.NewDatabaseAction);