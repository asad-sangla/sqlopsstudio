/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { Registry } from 'vs/platform/platform';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actionRegistry';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { KeyMod, KeyCode, KeyChord } from 'vs/base/common/keyCodes';
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';

import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryResultsEditor } from 'sql/parts/query/editor/queryResultsEditor';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import * as queryContext from 'sql/parts/query/common/queryContext';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { EditDataEditor } from 'sql/parts/editData/editor/editDataEditor';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import { RunQueryKeyboardAction, CancelQueryKeyboardAction } from 'sql/parts/query/execution/keyboardQueryActions';
import * as gridActions from 'sql/parts/grid/views/gridActions';
import * as gridCommands from 'sql/parts/grid/views/gridCommands';

const gridCommandsWeightBonus = 100; // give our commands a little bit more weight over other default list/tree commands

export const QueryEditorVisibleCondition = ContextKeyExpr.has(queryContext.queryEditorVisibleId);
export const ResultsGridFocusCondition = ContextKeyExpr.and(ContextKeyExpr.has(queryContext.resultsVisibleId), ContextKeyExpr.has(queryContext.resultsGridFocussedId));
export const ResultsMessagesFocusCondition = ContextKeyExpr.and(ContextKeyExpr.has(queryContext.resultsVisibleId), ContextKeyExpr.has(queryContext.resultsMessagesFocussedId));

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

let actionRegistry = <IWorkbenchActionRegistry>Registry.as(Extensions.WorkbenchActions);

// Query Actions
actionRegistry.registerWorkbenchAction(
		new SyncActionDescriptor(
			RunQueryKeyboardAction,
			RunQueryKeyboardAction.ID,
			RunQueryKeyboardAction.LABEL,
			{ primary: KeyCode.F5 }
		),
		RunQueryKeyboardAction.LABEL
	);

actionRegistry.registerWorkbenchAction(
		new SyncActionDescriptor(
			CancelQueryKeyboardAction,
			CancelQueryKeyboardAction.ID,
			CancelQueryKeyboardAction.LABEL,
			{ primary: KeyMod.Alt | KeyCode.PauseBreak }
		),
		CancelQueryKeyboardAction.LABEL
	);

// Grid actions

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.GRID_COPY_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsGridFocusCondition,
	primary: KeyMod.CtrlCmd | KeyCode.KEY_C,
	handler: gridCommands.copySelection
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.MESSAGES_SELECTALL_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsMessagesFocusCondition,
	primary: KeyMod.CtrlCmd | KeyCode.KEY_A,
	handler: gridCommands.selectAllMessages
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.GRID_SELECTALL_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsGridFocusCondition,
	primary: KeyMod.CtrlCmd | KeyCode.KEY_A,
	handler: gridCommands.selectAll
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.MESSAGES_COPY_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsMessagesFocusCondition,
	primary: KeyMod.CtrlCmd | KeyCode.KEY_C,
	handler: gridCommands.copyMessagesSelection
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.GRID_SAVECSV_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsGridFocusCondition,
	primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_R, KeyMod.CtrlCmd | KeyCode.KEY_C),
	handler: gridCommands.saveAsCsv
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.GRID_SAVEJSON_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsGridFocusCondition,
	primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_R, KeyMod.CtrlCmd | KeyCode.KEY_J),
	handler: gridCommands.saveAsJson
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.GRID_SAVEEXCEL_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: ResultsGridFocusCondition,
	primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KEY_R, KeyMod.CtrlCmd | KeyCode.KEY_E),
	handler: gridCommands.saveAsExcel
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.TOGGLERESULTS_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: QueryEditorVisibleCondition,
	primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_R,
	handler: gridCommands.toggleResultsPane
});

KeybindingsRegistry.registerCommandAndKeybindingRule({
	id: gridActions.TOGGLEMESSAGES_ID,
	weight: KeybindingsRegistry.WEIGHT.workbenchContrib(gridCommandsWeightBonus),
	when: QueryEditorVisibleCondition,
	primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_Y,
	handler: gridCommands.toggleMessagePane
});
