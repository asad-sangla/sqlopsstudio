/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as os from 'os';

import URI from 'vs/base/common/uri';
import { UNTITLED_SCHEMA } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';

export class PathUtilities {
    public static FILE_SCHEMA: string = 'file';

	/*
	* Public method to import image files for angular
	*/
	public static toUrl(path: string) {
		/* the baseUrl for the uri comes
		 * denormalized, so normalize the full
		 * path again here
		 */
		var space = new RegExp(' ', 'g');
		return require.toUrl(path).replace(space, '%20');
	}

    public static resolveCurrentDirectory(uri: string, rootPath: string): string {
        let sqlUri = URI.parse(uri);
        let currentDirectory: string;

        // use current directory of the sql file if sql file is saved
        if (sqlUri.scheme === PathUtilities.FILE_SCHEMA) {
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

    public static resolveFilePath(uri: string, filePath: string, rootPath: string): string {
        let currentDirectory = PathUtilities.resolveCurrentDirectory(uri, rootPath);
        return path.normalize(path.join(currentDirectory, filePath));
	}

    public static getRootPath(contextService: IWorkspaceContextService): string {
        return contextService.hasWorkspace() ? contextService.getWorkspace().resource.fsPath : undefined;
    }
}