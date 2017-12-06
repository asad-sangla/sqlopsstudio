/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IExtensionGalleryService, IExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/browser/editor';
import { IExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/common/extensions';
import { IConfigurationRegistry, Extensions as ConfigExtensions } from 'vs/platform/configuration/common/configurationRegistry';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { Registry } from 'vs/platform/registry/common/platform';
import { DashboardEditor } from 'sql/parts/dashboard/dashboardEditor';
import { DashboardInput } from 'sql/parts/dashboard/dashboardInput';
import { ClearRecentConnectionsAction } from 'sql/parts/connection/common/connectionActions';

import { ExtensionGalleryService } from 'vs/platform/extensionManagement/node/extensionGalleryService';
import { EditorDescriptor } from 'vs/workbench/browser/editor';
import { ExtensionTipsService } from 'vs/workbench/parts/extensions/electron-browser/extensionTipsService';
import { ExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/node/extensionsWorkbenchService';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actions';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { KeyMod, KeyCode, KeyChord } from 'vs/base/common/keyCodes';
import { localize } from 'vs/nls';
import { AddServerGroupAction, AddServerAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';

// Singletons
registerSingleton(IExtensionGalleryService, ExtensionGalleryService);
registerSingleton(IExtensionTipsService, ExtensionTipsService);
registerSingleton(IExtensionsWorkbenchService, ExtensionsWorkbenchService);

// Connection Dashboard registration
const dashboardEditorDescriptor = new EditorDescriptor(
	DashboardEditor,
	DashboardEditor.ID,
	'Dashboard'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(dashboardEditorDescriptor, [new SyncDescriptor(DashboardInput)]);

let actionRegistry = <IWorkbenchActionRegistry>Registry.as(Extensions.WorkbenchActions);

// Connection Actions
actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(
		ClearRecentConnectionsAction,
		ClearRecentConnectionsAction.ID,
		ClearRecentConnectionsAction.LABEL
	),
	ClearRecentConnectionsAction.LABEL
);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(
		AddServerGroupAction,
		AddServerGroupAction.ID,
		AddServerGroupAction.LABEL
	),
	AddServerGroupAction.LABEL
);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(
		AddServerAction,
		AddServerAction.ID,
		AddServerAction.LABEL
	),
	AddServerAction.LABEL
);

let configurationRegistry = <IConfigurationRegistry>Registry.as(ConfigExtensions.Configuration);
configurationRegistry.registerConfiguration({
	'id': 'connection',
	'title': 'Connection',
	'type': 'object',
	'properties': {
		'sql.maxRecentConnections': {
			'type': 'number',
			'default': 25,
			'description': localize('sql.maxRecentConnectionsDescription', 'The maximum number of recently used connections to store in the connection list.')
		},
		'sql.defaultEngine': {
			'type': 'string',
			'description': localize('sql.defaultEngineDescription', 'Default SQL Engine to use. This drives default language provider in .sql files and the default to use when creating a new connection. Valid option is currently MSSQL'),
			'default': 'MSSQL'
		},
	}
});