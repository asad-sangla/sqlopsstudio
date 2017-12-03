/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as os from 'os';

import URI from 'vs/base/common/uri';
import { UNTITLED_SCHEMA } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkspaceContextService, WorkbenchState } from 'vs/platform/workspace/common/workspace';

export const FILE_SCHEMA: string = 'file';

export function resolveCurrentDirectory(uri: string, rootPath: string): string {
	let sqlUri = URI.parse(uri);
	let currentDirectory: string;

	// use current directory of the sql file if sql file is saved
	if (sqlUri.scheme === FILE_SCHEMA) {
		currentDirectory = path.dirname(sqlUri.fsPath);
	} else if (sqlUri.scheme === UNTITLED_SCHEMA) {
		// if sql file is unsaved/untitled but a workspace is open use workspace root
		let root = rootPath;
		if (root) {
			currentDirectory = root;
		} else {
			// use temp directory
			currentDirectory = os.tmpdir();
		}
	} else {
		currentDirectory = path.dirname(sqlUri.path);
	}
	return currentDirectory;
}

export function resolveFilePath(uri: string, filePath: string, rootPath: string): string {
	let currentDirectory = resolveCurrentDirectory(uri, rootPath);
	return path.normalize(path.join(currentDirectory, filePath));
}

export function getRootPath(contextService: IWorkspaceContextService): string {
	let isWorkspace = contextService.getWorkbenchState() === WorkbenchState.WORKSPACE;
	if (isWorkspace) {
		return contextService.getWorkspace().folders[0].uri.fsPath;
	}

	return undefined;
}
