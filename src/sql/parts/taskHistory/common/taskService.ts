/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TaskNode, TaskStatus } from 'sql/parts/taskHistory/common/taskNode';
import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import Event, { Emitter } from 'vs/base/common/event';
export const SERVICE_ID = 'taskHistoryService';
import { ILifecycleService } from 'vs/platform/lifecycle/common/lifecycle';
import { IChoiceService} from 'vs/platform/message/common/message';
import { localize } from 'vs/nls';
import Severity from 'vs/base/common/severity';
import { TPromise } from 'vs/base/common/winjs.base';

export const ITaskService = createDecorator<ITaskService>(SERVICE_ID);

export interface ITaskService {
	_serviceBrand: any;
	onTaskComplete: Event<TaskNode>;
	onAddNewTask: Event<TaskNode>;
	handleNewTask(task: TaskNode): void;
	handleTaskComplete(eventArgs: TaskStatusChangeArgs): void;
	getAllTasks(): TaskNode;
	getNumberOfInProgressTasks(): number;
}

export interface TaskStatusChangeArgs {
	taskId: string;
	status: TaskStatus;
	message?: string;
}


export class TaskService implements ITaskService {
	public _serviceBrand: any;
	private _taskQueue: TaskNode;
	private _onTaskComplete = new Emitter<TaskNode>();
	private _onAddNewTask = new Emitter<TaskNode>();

	constructor(
		@ILifecycleService lifecycleService: ILifecycleService,
		@IChoiceService private choiceService: IChoiceService
	) {
		this._taskQueue = new TaskNode('Root', undefined, undefined);
		this._onTaskComplete = new Emitter<TaskNode>();
		this._onAddNewTask = new Emitter<TaskNode>();

		lifecycleService.onWillShutdown(event => event.veto(this.beforeShutdown()));
	}

	public handleNewTask(task: TaskNode): void {
		if (this._taskQueue.hasChildren) {
			this._taskQueue.children.unshift(task);
		} else {
			this._taskQueue.hasChildren = true;
			this._taskQueue.children = [task];
		}
		this._onAddNewTask.fire(task);
	}

	public beforeShutdown(): TPromise<boolean> {
		const message = localize('InProgressWarning', '1 or more tasks are in progress. Are you sure you want to quit?');
		const options = [
			localize('yes', "Yes"),
			localize('no', "No")
		];

		return new TPromise<boolean>((resolve) => {
			let numOfInprogressTasks = this.getNumberOfInProgressTasks();
			if (numOfInprogressTasks > 0) {
				this.choiceService.choose(Severity.Warning, message, options, 0, false).done(choice => {
					switch (choice) {
						case 0:
							// Todo: cancel the remaining tasks
							resolve(false);
						case 1:
							resolve(true);
					}
				});
			} else {
				resolve(false);
			}
		});
	}

	public handleTaskComplete(eventArgs: TaskStatusChangeArgs): void {
		var task = this.getTaskInQueue(eventArgs.taskId);
		if (task) {
			task.status = eventArgs.status;
			if (eventArgs.message) {
				task.message = eventArgs.message;
			}
			task.endTime = new Date().toLocaleTimeString();
			task.timer.end();
			this._onTaskComplete.fire(task);
		}
	}

	private getTaskInQueue(taskId: string): TaskNode {
		if (this._taskQueue.hasChildren) {
			return this._taskQueue.children.find(x => x.id === taskId);
		}
		return undefined;
	}

	public get onTaskComplete(): Event<TaskNode> {
		return this._onTaskComplete.event;
	}

	public get onAddNewTask(): Event<TaskNode> {
		return this._onAddNewTask.event;
	}

	public getNumberOfInProgressTasks(): number {
		if (this._taskQueue.hasChildren) {
			var inProgressTasks = this._taskQueue.children.filter(x => x.status === TaskStatus.inProgress);
			return inProgressTasks ? inProgressTasks.length : 0;
		}
		return 0;
	}

	public getAllTasks(): TaskNode {
		return this._taskQueue;
	}
}