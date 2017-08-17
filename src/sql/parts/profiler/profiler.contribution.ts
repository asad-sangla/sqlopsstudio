/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { EditorDescriptor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { Registry } from 'vs/platform/registry/common/platform';
import { IEditorRegistry, Extensions as EditorExtensions } from 'vs/workbench/common/editor';
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';

import { ProfilerInput } from './profilerInput';
import { ProfilerEditor } from './profilerEditor';

const profilerDescriptor = new EditorDescriptor(
	ProfilerEditor.ID,
	'Profiler',
	'sql/parts/profiler/profilerEditor',
	'ProfilerEditor'
);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(profilerDescriptor, [new SyncDescriptor(ProfilerInput)]);
