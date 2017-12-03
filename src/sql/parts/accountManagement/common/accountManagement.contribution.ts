/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Registry } from 'vs/platform/registry/common/platform';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actions';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';

import { ManageLinkedAccountAction } from 'sql/parts/accountManagement/accountListStatusbar/accountListStatusbarItem';

let actionRegistry = <IWorkbenchActionRegistry>Registry.as(Extensions.WorkbenchActions);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(
		ManageLinkedAccountAction,
		ManageLinkedAccountAction.ID,
		ManageLinkedAccountAction.LABEL
	),
	ManageLinkedAccountAction.LABEL
);
