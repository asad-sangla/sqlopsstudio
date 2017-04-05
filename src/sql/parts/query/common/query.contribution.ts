/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/platform';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actionRegistry';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { KeyMod, KeyCode } from 'vs/base/common/keyCodes';

import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryResultsEditor } from 'sql/parts/query/editor/queryResultsEditor';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { EditDataEditor } from 'sql/parts/editData/editor/editDataEditor';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { RunQueryKeyboardAction, CancelQueryKeyboardAction } from 'sql/parts/query/execution/keyboardQueryActions';

// Editor
const queryResultsEditorDescriptor = new EditorDescriptor(
	QueryResultsEditor.ID,
	'QueryResults',
	'sql/parts/query/editor/queryResultsEditor',
	'QueryResultsEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(queryResultsEditorDescriptor, [new SyncDescriptor(QueryResultsInput)]);

// Editor
const queryEditorDescriptor = new EditorDescriptor(
	QueryEditor.ID,
	'Query',
	'sql/parts/query/editor/queryEditor',
	'QueryEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(queryEditorDescriptor, [new SyncDescriptor(QueryInput)]);

// Editor
const editDataEditorDescriptor = new EditorDescriptor(
	EditDataEditor.ID,
	'EditData',
	'sql/parts/editData/editor/editDataEditor',
	'EditDataEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(editDataEditorDescriptor, [new SyncDescriptor(EditDataInput)]);

// Query Actions
Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions)
	.registerWorkbenchAction(
		new SyncActionDescriptor(
			RunQueryKeyboardAction,
			RunQueryKeyboardAction.ID,
			RunQueryKeyboardAction.LABEL,
			{ primary: KeyCode.F5 }
		),
		RunQueryKeyboardAction.LABEL
	);

Registry.as<IWorkbenchActionRegistry>(Extensions.WorkbenchActions)
	.registerWorkbenchAction(
		new SyncActionDescriptor(
			CancelQueryKeyboardAction,
			CancelQueryKeyboardAction.ID,
			CancelQueryKeyboardAction.LABEL,
			{ primary: KeyMod.Alt | KeyCode.PauseBreak }
		),
		CancelQueryKeyboardAction.LABEL
	);