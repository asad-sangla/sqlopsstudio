/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { TaskNode, TaskStatus } from 'sql/parts/taskHistory/common/taskNode';

export class TaskService {
	public getAllTasks(): TaskNode {
		var rootNode = new TaskNode('Root', 'RootType', 'RootDescription', TaskStatus.success);
		var task1 = new TaskNode('Task1', 'Backup Task1', 'Backup completed successfully', TaskStatus.success);
		var task2 = new TaskNode('Task2', 'Restore Task1', 'Restoring DB testDB is failed', TaskStatus.fail);
		var task3 = new TaskNode('Task3', 'Restore Task2', 'Restoring DB test1 is in progress', TaskStatus.inProgress);
		rootNode.hasChildren = true;
		rootNode.children = [task1, task2, task3];
		return rootNode;
	}
}