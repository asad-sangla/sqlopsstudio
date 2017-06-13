/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { $ } from 'vs/base/browser/dom';
import { ITree, IRenderer } from 'vs/base/parts/tree/browser/tree';
import { ITaskHistoryTemplateData } from 'sql/parts/taskHistory/viewlet/templateData';
import { TaskNode, TaskStatus } from 'sql/parts/taskHistory/common/taskNode';
import dom = require('vs/base/browser/dom');

/**
 * Renders the tree items.
 * Uses the dom template to render task history.
 */
export class TaskHistoryRenderer implements IRenderer {

	public static readonly TASKOBJECT_HEIGHT = 65;
	private static readonly TASKOBJECT_TEMPLATE_ID = 'carbonTask';
	private static readonly FAIL_CLASS = 'fail-status';
	private static readonly SUCCESS_CLASS = 'success-status';
	private static readonly INPROGRESS_CLASS = 'in-progress-status';

	/**
	 * Returns the element's height in the tree, in pixels.
	 */
	public getHeight(tree: ITree, element: any): number {
		return TaskHistoryRenderer.TASKOBJECT_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		return TaskHistoryRenderer.TASKOBJECT_TEMPLATE_ID;
	}

	/**
	 * Render template in a dom element based on template id
	 */
	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {
		const taskTemplate: ITaskHistoryTemplateData = Object.create(null);
		taskTemplate.root = dom.append(container, $('.task-group'));
		taskTemplate.icon = dom.append(taskTemplate.root, $('img.task-icon'));
		var titleContainer = dom.append(taskTemplate.root, $('div.task-details'));
		taskTemplate.title = dom.append(titleContainer, $('div.title'));
		taskTemplate.description = dom.append(titleContainer, $('div.description'));
		taskTemplate.time = dom.append(titleContainer, $('div.time'));
		return taskTemplate;
	}

	/**
	 * Render a element, given an object bag returned by the template
	 */
	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		this.renderTask(tree, element, templateData);
	}

	private renderTask(tree: ITree, taskNode: TaskNode, templateData: ITaskHistoryTemplateData): void {
		if (taskNode) {
			switch (taskNode.status) {
				case TaskStatus.succeeded:
					templateData.icon.classList.remove(TaskHistoryRenderer.FAIL_CLASS);
					templateData.icon.classList.remove(TaskHistoryRenderer.INPROGRESS_CLASS);
					templateData.icon.classList.add(TaskHistoryRenderer.SUCCESS_CLASS);
					break;
				case TaskStatus.failed:
					templateData.icon.classList.remove(TaskHistoryRenderer.SUCCESS_CLASS);
					templateData.icon.classList.remove(TaskHistoryRenderer.INPROGRESS_CLASS);
					templateData.icon.classList.add(TaskHistoryRenderer.FAIL_CLASS);
					break;
				case TaskStatus.inProgress:
					templateData.icon.classList.remove(TaskHistoryRenderer.FAIL_CLASS);
					templateData.icon.classList.remove(TaskHistoryRenderer.SUCCESS_CLASS);
					templateData.icon.classList.add(TaskHistoryRenderer.INPROGRESS_CLASS);
			}
			templateData.title.textContent = taskNode.taskName;
			let description = taskNode.serverName;
			if (taskNode.databaseName) {
				description += ' | ' + taskNode.databaseName;
			}
			templateData.description.textContent = description;
			this.timer(taskNode, templateData);
			let self = this;
			setInterval(function () {
				self.timer(taskNode, templateData);
			}, 1000);
		}
	}

	public timer(taskNode: TaskNode, templateData: ITaskHistoryTemplateData) {
		let timeLabel = '';
		if (taskNode.status === TaskStatus.failed) {
			timeLabel += 'Error: ' + taskNode.message;
		} else {
			if (taskNode.startTime) {
				timeLabel = taskNode.startTime;
			}
			if (taskNode.endTime) {
				timeLabel += ' - ' + taskNode.endTime;
			}

			if (taskNode.timer) {
				var timeDuration = new Date(taskNode.timer.getDuration());
				timeLabel += ' (' + timeDuration.getMinutes() + ':' + timeDuration.getSeconds() + ')';
			}
		}
		templateData.time.textContent = timeLabel;
		templateData.root.title = timeLabel;
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		// no op
		// InputBox disposed in wrapUp

	}
}

