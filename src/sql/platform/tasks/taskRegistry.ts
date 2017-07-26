/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as platform from 'vs/platform/registry/common/platform';
import { IJSONSchema } from 'vs/base/common/jsonSchema';
import { Action } from 'vs/base/common/actions';
import { IConstructorSignature3 } from 'vs/platform/instantiation/common/instantiation';

export type TaskIdentifier = string;

export interface ActionICtor extends IConstructorSignature3<string, string, string, Action> {
	ID: string;
	LABEL: string;
	ICON: string;
}

export const Extensions = {
	TaskContribution: 'workbench.contributions.tasks'
};

export interface ITaskRegistry {
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
	private _idCtorMap: { [id: string]: ActionICtor } = {};

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
	registerTask(id: string, description: string, ctor: ActionICtor): TaskIdentifier {
		this._idCtorMap[id] = ctor;
		return id;
	}
}

const taskRegistry = new TaskRegistry();
platform.Registry.add(Extensions.TaskContribution, taskRegistry);

export function registerTask(id: string, description: string, ctor: ActionICtor): TaskIdentifier {
	return taskRegistry.registerTask(id, description, ctor);
}