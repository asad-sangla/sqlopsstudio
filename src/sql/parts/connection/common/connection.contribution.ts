/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IExtensionGalleryService, IExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { ExtensionGalleryService } from 'vs/platform/extensionManagement/node/extensionGalleryService';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { IExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/common/extensions';
import { ExtensionTipsService } from 'vs/workbench/parts/extensions/electron-browser/extensionTipsService';
import { ExtensionsWorkbenchService } from 'vs/workbench/parts/extensions/node/extensionsWorkbenchService';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { Registry } from 'vs/platform/platform';

import { DashboardEditor } from 'sql/parts/dashboard/dashboardEditor';
import { DashboardInput } from 'sql/parts/dashboard/dashboardInput';

// Singletons
registerSingleton(IExtensionGalleryService, ExtensionGalleryService);
registerSingleton(IExtensionTipsService, ExtensionTipsService);
registerSingleton(IExtensionsWorkbenchService, ExtensionsWorkbenchService);

// Connection Dashboard registration
const dashboardEditorDescriptor = new EditorDescriptor(
	DashboardEditor.ID,
	'Dashboard',
	'sql/parts/dashboard/dashboardEditor',
	'DashboardEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(dashboardEditorDescriptor, [new SyncDescriptor(DashboardInput)]);
