/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';
import * as Utils from 'sql/parts/connection/common/utils';

export enum TaskStatus {
	notStarted = 0,
	inProgress = 1,
	succeeded = 2,
	succeededWithWarning = 3,
	failed = 4,
	canceled = 5,
	canceling = 6
}

export enum TaskExecutionMode {
	execute = 0,
	script = 1
}

export class TaskNode {
	/**
     * id for TaskNode
     */
	public id: string;

    /**
     * string defining the type of the task - for example Backup, Restore
     */
	public taskName: string;

    /**
     * sever name
     */
	public serverName: string;

	/**
     * Database Name
     */
	public databaseName: string;

	/**
     * Provider Name
     */
	public providerName: string;


	/**
     * The start time of the task
     */
	public startTime: string;

	/**
     * The end time of the task
     */
	public endTime: string;

	/**
     * The timer for the task
     */
	public timer: Utils.Timer;

	/**
     * Does this node have children
     */
	public hasChildren: boolean;

	/**
 	 * Children of this node
 	 */
	public children: TaskNode[];

	/**
 	 * Task's message
 	 */
	public message: string;

	/**
     * Status of the task
     */
	public status: TaskStatus;

	/**
     * Execution mode of task
     */
	public taskExecutionMode: TaskExecutionMode;

	/**
	 * Indicates if the task can be canceled
	 */
	public isCancelable: boolean;

	constructor(taskName: string, serverName: string, databaseName: string, taskId: string = undefined, taskExecutionMode: TaskExecutionMode = TaskExecutionMode.execute) {
		if (taskId) {
			this.id = taskId;
		} else {
			this.id = Utils.generateGuid();
		}

		this.taskName = taskName;
		this.serverName = serverName;
		this.databaseName = databaseName;
		this.timer = new Utils.Timer();
		this.startTime = new Date().toLocaleTimeString();
		this.status = TaskStatus.inProgress;
		this.hasChildren = false;
		this.taskExecutionMode = taskExecutionMode;
	}
}