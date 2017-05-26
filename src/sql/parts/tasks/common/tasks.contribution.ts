/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { Registry } from 'vs/platform/platform';
import { TaskDialogEditor } from "sql/parts/tasks/dialog/taskDialogEditor";
import { TaskDialogInput } from "sql/parts/tasks/dialog/taskDialogInput";

import { CreateLoginEditor } from 'sql/parts/admin/security/createLoginEditor';
import { CreateLoginInput } from 'sql/parts/admin/security/createLoginInput';
import { BackupInput } from 'sql/parts/disasterRecovery/backup/backupInput';
import { BackupEditor } from 'sql/parts/disasterRecovery/backup/backupEditor';

// Task Dialog registration
const taskDialogEditorDescriptor = new EditorDescriptor(
	TaskDialogEditor.ID,
	'Task Dialog',
	'sql/parts/tasks/dialog/taskDialogEditor',
	'TaskDialogEditor'
);

// Create Login registration
const createLoginEditorDescriptor = new EditorDescriptor(
	CreateLoginEditor.ID,
	'CreateLogin',
	'sql/parts/admin/security/createLoginEditor',
	'CreateLoginEditor'
);

// Backup registration
const backupEditorDescriptor = new EditorDescriptor(
	BackupEditor.ID,
 	'Backup',
 	'sql/parts/disasterRecovery/backup/backupEditor',
 	'BackupEditor'
 );

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(createLoginEditorDescriptor, [new SyncDescriptor(CreateLoginInput)]);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(taskDialogEditorDescriptor, [new SyncDescriptor(TaskDialogInput)]);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(backupEditorDescriptor, [new SyncDescriptor(BackupInput)]);
