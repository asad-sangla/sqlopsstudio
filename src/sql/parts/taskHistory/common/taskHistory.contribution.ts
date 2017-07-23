/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import 'vs/css!sql/media/actionBarLabel';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ToggleViewletAction } from 'vs/workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actionRegistry';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { Registry } from 'vs/platform/registry/common/platform';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { VIEWLET_ID } from 'sql/parts/taskHistory/viewlet/taskHistoryViewlet';
import lifecycle = require('vs/base/common/lifecycle');
import ext = require('vs/workbench/common/contributions');
import { ITaskService } from 'sql/parts/taskHistory/common/taskService';
import { IActivityBarService, NumberBadge } from 'vs/workbench/services/activity/common/activityBarService';

export class StatusUpdater implements ext.IWorkbenchContribution {
	static ID = 'data.taskhistory.statusUpdater';

	private badgeHandle: lifecycle.IDisposable;
	private toDispose: lifecycle.IDisposable[];

	constructor(
		@IActivityBarService private activityBarService: IActivityBarService,
		@ITaskService private _taskService: ITaskService
	) {
		this.toDispose = [];
		let self = this;

		this.toDispose.push(this._taskService.onAddNewTask(args => {
			self.onServiceChange();
		}));

		this.toDispose.push(this._taskService.onTaskComplete(task => {
			self.onServiceChange();
		}));

	}

	private onServiceChange(): void {
		lifecycle.dispose(this.badgeHandle);
		let NumOfInProgressTask = this._taskService.getNumberOfInProgressTasks();
		let badge = new NumberBadge(NumOfInProgressTask, n => localize('inProgressTasksChangesBadge', '{0} in progress tasks', n));
		this.badgeHandle = this.activityBarService.showActivity(VIEWLET_ID, badge, 'taskhistory-viewlet-label');
	}

	public getId(): string {
		return StatusUpdater.ID;
	}

	public dispose(): void {
		this.toDispose = lifecycle.dispose(this.toDispose);
		lifecycle.dispose(this.badgeHandle);
	}
}


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
	-90
);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

// Register StatusUpdater
(<ext.IWorkbenchContributionsRegistry>Registry.as(ext.Extensions.Workbench)).registerWorkbenchContribution(StatusUpdater);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	new SyncActionDescriptor(
		TaskHistoryViewletAction,
		TaskHistoryViewletAction.ID,
		TaskHistoryViewletAction.LABEL,
		{ primary: KeyMod.CtrlCmd | KeyCode.KEY_T }),
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