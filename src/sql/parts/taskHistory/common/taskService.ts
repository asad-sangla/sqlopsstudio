/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TaskNode, TaskStatus } from 'sql/parts/taskHistory/common/taskNode';
import * as Utils from 'sql/parts/connection/common/utils';

export class TaskService {
	public getAllTasks(): TaskNode {
		var startTime = new Date().toLocaleTimeString();
		var endTime = new Date().toLocaleTimeString();
		var rootNode = new TaskNode('Root', 'RootType', undefined, undefined, undefined, TaskStatus.success);
		var task1 = new TaskNode('Task1', 'Backup Task1', 'server1', 'db1', startTime, TaskStatus.success);
		var task2 = new TaskNode('Task2', 'Restore Task1', 'server2', 'db2', startTime, TaskStatus.fail);
		var task3 = new TaskNode('Task3', 'Restore Task2', 'server3', 'db3', startTime, TaskStatus.inProgress);
		task3.timer = new Utils.Timer();
		task1.endTime = endTime;
		task2.endTime = endTime;
		rootNode.hasChildren = true;
		rootNode.children = [task1, task2, task3];
		return rootNode;
	}
}