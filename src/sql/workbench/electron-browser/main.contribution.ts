/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/platform';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actionRegistry';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';

// Disabling this until we have proper handling of the Edit Data action. It needs to prompt for an active / recent etc. connection to use, and then
// if that's a master / default connection prompt for the actual DB to work against
// const workbenchActionsRegistry = Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions);
// workbenchActionsRegistry.registerWorkbenchAction(new SyncActionDescriptor(EditDataAction, EditDataAction.ID, EditDataAction.LABEL), 'Edit Data');