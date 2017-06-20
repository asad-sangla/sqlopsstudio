/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/media/actionBarLabel';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ToggleViewletAction } from 'vs/workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actionRegistry';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { Registry } from 'vs/platform/platform';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';

import { VIEWLET_ID } from 'sql/parts/connection/common/connectionManagement';

// Viewlet Action
export class OpenConnectionsViewletAction extends ToggleViewletAction {
	public static ID = VIEWLET_ID;
	public static LABEL = 'Show Connections';

	constructor(
		id: string,
		label: string,
		@IViewletService viewletService: IViewletService,
		@IWorkbenchEditorService editorService: IWorkbenchEditorService
	) {
		super(id, label, VIEWLET_ID, viewletService, editorService);
	}
}

// Viewlet
const viewletDescriptor = new ViewletDescriptor(
	'sql/parts/registeredServer/viewlet/connectionViewlet',
	'ConnectionViewlet',
	VIEWLET_ID,
	'Servers',
	'connectionViewlet',
	-100
);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).setDefaultViewletId(VIEWLET_ID);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	new SyncActionDescriptor(
		OpenConnectionsViewletAction,
		OpenConnectionsViewletAction.ID,
		OpenConnectionsViewletAction.LABEL,
		{ primary: KeyMod.CtrlCmd | KeyCode.Shift | KeyCode.KEY_C }),
	'View: Show Servers',
	localize('view', "View")
);

let configurationRegistry = <IConfigurationRegistry>Registry.as(Extensions.Configuration);
configurationRegistry.registerConfiguration({
	'id': 'databaseConnections',
	'title': 'Database Connections',
	'type': 'object',
	'properties': {
		'datasource.connections': {
			'description': 'data source connections',
			'type': 'array'
		},
		'datasource.connectionGroups': {
			'description': 'data source connections',
			'type': 'array'
		}
	}
});
