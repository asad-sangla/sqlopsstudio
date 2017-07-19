/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as platform from 'vs/platform/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import * as nls from 'vs/nls';
import { Action } from 'vs/base/common/actions';
import { IConstructorSignature2 } from 'vs/platform/instantiation/common/instantiation';

export type TaskIdentifier = string;

export interface ActionICtor extends IConstructorSignature2<string, string, Action> {
	ID: string;
	LABEL: string;
}

export const Extensions = {
	TaskContribution: 'workbench.contributions.tasks'
};

export interface ITaskRegistry {
	taskSchema: IJSONSchema;
	/**
	 * Returns a map of action ids to their contructors;
	 */
	idToCtorMap: { [id: string]: ActionICtor };

	/**
	 * Returns array of registered ids
	 */
	ids: Array<string>;

	/**
	 * Registers an action as a task which can be ran given the schema as an input
	 * @param id id of the task
	 * @param description desciption of the task
	 * @param schema schema of expected input
	 * @param ctor contructor of the action
	 */
	registerTask(id: string, description: string, schema: IJSONSchema, ctor: ActionICtor): TaskIdentifier;
}

class TaskRegistry implements ITaskRegistry {
	private _taskSchema: IJSONSchema = { type: 'object', description: nls.localize('schema.workbenchTask', 'Tasks used through workbench'), properties: {}, additionalProperties: false };
	private _idCtorMap: { [id: string]: ActionICtor } = {};

	get taskSchema(): IJSONSchema {
		return this._taskSchema;
	}

	get idToCtorMap(): { [id: string]: ActionICtor } {
		return this._idCtorMap;
	}

	get ids(): Array<string> {
		return Object.keys(this._idCtorMap);
	}

	/**
	 * Registers an action as a task which can be ran given the schema as an input
	 * @param id id of the task
	 * @param description desciption of the task
	 * @param schema schema of expected input
	 * @param ctor contructor of the action
	 */
	registerTask(id: string, description: string, schema: IJSONSchema, ctor: ActionICtor): TaskIdentifier {
		this._taskSchema.properties[id] = schema;
		this._idCtorMap[id] = ctor;
		return id;
	}
}

const taskRegistry = new TaskRegistry();
platform.Registry.add(Extensions.TaskContribution, taskRegistry);

export function registerTask(id: string, description: string, schema: IJSONSchema, ctor: ActionICtor): TaskIdentifier {
	return taskRegistry.registerTask(id, description, schema, ctor);
}