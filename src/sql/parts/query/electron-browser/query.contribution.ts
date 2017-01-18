
import { localize } from 'vs/nls';
import { Registry } from 'vs/platform/platform';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
// import { ExtensionEditor } from 'vs/workbench/parts/extensions/browser/extensionEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
// import { ExtensionsInput } from 'vs/workbench/parts/extensions/common/extensionsInput';

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

