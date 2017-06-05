/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import 'vs/css!sql/parts/taskHistory/viewlet/media/taskHistoryViewlet';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ToggleViewletAction } from 'vs/workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actionRegistry';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { Registry } from 'vs/platform/platform';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { VIEWLET_ID } from 'sql/parts/taskHistory/viewlet/taskHistoryViewlet';

// Viewlet Action
export class TaskHistoryViewletAction extends ToggleViewletAction {
	public static ID = VIEWLET_ID;
	public static LABEL = nls.localize({ key: 'showTaskHistory', comment: ['Show task history'] }, 'Show task history');

	constructor(
		id: string,
		label: string,
		@IViewletService viewletService: IViewletService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService
	) {
		super(id, label, VIEWLET_ID, viewletService, editorService);
	}
}

// Viewlet
const viewletDescriptor = new ViewletDescriptor(
	'sql/parts/taskHistory/viewlet/taskHistoryViewlet',
	'TaskHistoryViewlet',
	VIEWLET_ID,
	'Task History',
	'taskHistoryViewlet',
	200
);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	new SyncActionDescriptor(
		TaskHistoryViewletAction,
		TaskHistoryViewletAction.ID,
		TaskHistoryViewletAction.LABEL,
		{ primary: KeyMod.CtrlCmd | KeyCode.Shift | KeyCode.KEY_T }),
	'View: Show Task Histry',
	localize('view', "View")
);

let configurationRegistry = <IConfigurationRegistry>Registry.as(Extensions.Configuration);
configurationRegistry.registerConfiguration({
	'id': 'taskHistory',
	'title': 'Task History',
	'type': 'object',
	'properties': {
		'datasource.task': {
			'description': 'Operation Task Status',
			'type': 'array'
		}
	}
});