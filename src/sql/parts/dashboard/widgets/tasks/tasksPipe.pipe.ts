/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { Pipe, PipeTransform } from '@angular/core';
import { Task } from './tasksWidget.component';

@Pipe({
	name: 'taskPipe'
})
export class TaskPipe implements PipeTransform {
	transform(items: Task[], context: string): Task[] {
		return items.filter(item => {
			if (item.show_condition) {
				return item.show_condition() && (item.context === undefined || item.context === context);
			}

			return item.context === undefined || item.context === context;
		});
	}
}
