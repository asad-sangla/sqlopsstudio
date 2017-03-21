/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/extensions';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { IExtensionGalleryService, IExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { ExtensionGalleryService } from 'vs/platform/extensionManagement/node/extensionGalleryService';
import { IKeybindings } from 'vs/platform/keybinding/common/keybinding';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { ViewletRegistry, Extensions as ViewletExtensions, ViewletDescriptor, ToggleViewletAction } from 'vs/workbench/browser/viewlet';
import { IWorkbenchActionRegistry, Extensions as ActionExtensions } from 'vs/workbench/common/actionRegistry';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { IExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/common/extensions';
import { ExtensionTipsService } from 'vs/workbench/parts/extensions/electron-browser/extensionTipsService';
import { ExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/node/extensionsWorkbenchService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { Registry } from 'vs/platform/platform';

import { VIEWLET_ID } from 'sql/parts/connection/common/connectionManagement';
import { DashboardEditor } from 'sql/parts/connection/dashboard/dashboardEditor';
import { DashboardInput } from 'sql/parts/connection/dashboard/dashboardInput';

// Singletons
registerSingleton(IExtensionGalleryService, ExtensionGalleryService);
registerSingleton(IExtensionTipsService, ExtensionTipsService);
registerSingleton(IExtensionsWorkbenchService, ExtensionsWorkbenchService);

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

const openViewletKb: IKeybindings = {
	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_C
};

// Viewlet
const viewletDescriptor = new ViewletDescriptor(
	'sql/parts/connection/electron-browser/connectionViewlet',
	'ConnectionViewlet',
	VIEWLET_ID,
	'Connections',
	'extensions',
	0
);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).registerViewlet(viewletDescriptor);

Registry.as<ViewletRegistry>(ViewletExtensions.Viewlets).setDefaultViewletId(VIEWLET_ID);

const registry = Registry.as<IWorkbenchActionRegistry>(ActionExtensions.WorkbenchActions);
registry.registerWorkbenchAction(
	new SyncActionDescriptor(
		OpenConnectionsViewletAction,
		OpenConnectionsViewletAction.ID,
		OpenConnectionsViewletAction.LABEL,
		openViewletKb),
	'View: Show Connections',
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

// Connection Dashboard registration
const dashboardEditorDescriptor = new EditorDescriptor(
	DashboardEditor.ID,
	'Dashboard',
	'sql/parts/connection/dashboard/dashboardEditor',
	'DashboardEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(dashboardEditorDescriptor, [new SyncDescriptor(DashboardInput)]);
