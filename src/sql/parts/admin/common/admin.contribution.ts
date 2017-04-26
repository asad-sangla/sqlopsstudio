/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// import 'vs/css!sql/parts/connection/viewlet/media/extensions';

import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { Extensions } from 'vs/platform/configuration/common/configurationRegistry';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { Registry } from 'vs/platform/platform';

import { CreateDatabaseEditor } from 'sql/parts/admin/database/create/createDatabaseEditor';
import { CreateDatabaseInput } from 'sql/parts/admin/database/create/createDatabaseInput';


// Create Database registration
const createDatabaseEditorDescriptor = new EditorDescriptor(
	CreateDatabaseEditor.ID,
	'CreateDatabase',
	'sql/parts/admin/database/create/createDatabaseEditor',
	'CreateDatabaseEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(createDatabaseEditorDescriptor, [new SyncDescriptor(CreateDatabaseInput)]);
