/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from 'vs/nls';
import { Registry } from 'vs/platform/platform';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';

import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryInput } from 'sql/parts/query/common/queryInput';

// Editor
const editorDescriptor = new EditorDescriptor(
	QueryEditor.ID,
	"Query",
	'sql/parts/query/editor/queryEditor',
	'QueryEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(editorDescriptor, [new SyncDescriptor(QueryInput)]);
