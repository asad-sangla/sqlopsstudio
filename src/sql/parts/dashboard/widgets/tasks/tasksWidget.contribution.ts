/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { registerDashboardWidget } from 'sql/platform/dashboard/common/widgetRegistry';

let tasksSchema: IJSONSchema = {
	type: 'object',
};

registerDashboardWidget('tasks-widget', '', tasksSchema);