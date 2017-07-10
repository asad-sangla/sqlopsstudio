/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import { ITaskService } from 'sql/parts/taskHistory/common/taskService';
import { TaskNode } from 'sql/parts/taskHistory/common/taskNode';
import { IErrorMessageService } from 'sql/parts/connection/common/connectionManagement';
import Severity from 'vs/base/common/severity';

export class CancelAction extends Action {
	public static ID = 'taskHistory.cancel';
	public static LABEL = localize('cancel', 'Cancel');

	constructor(
		id: string,
		label: string,
		@ITaskService private _taskService: ITaskService,
		@IErrorMessageService private _errorMessageService: IErrorMessageService
	) {
		super(id, label);
	}
	public run(element: TaskNode): TPromise<boolean> {
		if (element instanceof TaskNode) {
			this._taskService.cancelTask(element.providerName, element.id).then((result) => {
				if (!result) {
					let error = localize('errorMsgFromCancelTask', 'The task is failed to cancel.');
					this.showError(error);
				}
			}, error => {
				this.showError(error);
				return TPromise.as(true);
			});
		}
		return TPromise.as(true);
	}

	private showError(errorMessage: string) {
		if (this._errorMessageService) {
			this._errorMessageService.showDialog(undefined, Severity.Error, '', errorMessage);
		}
	}
}