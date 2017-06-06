/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
'use strict';
import * as Utils from 'sql/parts/connection/common/utils';

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
     * Status of the task
     */
	public status: TaskStatus;

	constructor(nodeId: string, taskName: string, serverName: string, databaseName: string, startTime: string, status: TaskStatus) {
		this.id = nodeId;
		this.taskName = taskName;
		this.serverName = serverName;
		this.databaseName = databaseName;
		this.startTime = startTime;
		this.status = status;
		this.hasChildren = false;
	}
}