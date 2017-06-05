/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

'use strict';

export enum TaskStatus {
	fail = 0,
	success = 1,
	inProgress = 2,
}

export class TaskNode {
	/**
     * id for TaskNode
     */
	public id: string;

    /**
     * string defining the type of the node - for example Backup, Restore
     */
	public taskType: string;

    /**
     * Label describing this task
     */
	public description: string;

	/**
     * Does this node have children
     */
	public hasChildren: boolean;

	/**
 	 * Children of this node
 	 */
	public children: TaskNode[];

	/**
     * Status of the task
     */
	public status: TaskStatus;

	constructor(nodeId: string, taskType: string, description: string, status: TaskStatus) {
		this.id = nodeId;
		this.taskType = taskType;
		this.description = description;
		this.status = status;
		this.hasChildren = false;
	}
}