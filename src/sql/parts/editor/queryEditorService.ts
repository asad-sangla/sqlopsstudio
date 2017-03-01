/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { EditorInput } from 'vs/workbench/common/editor';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import URI from 'vs/base/common/uri';
const fs = require('fs');

/**
 * Service wrapper for opening and creating SQL documents as sql editor inputs
 */
export default class QueryEditorService {

    constructor(
		@IUntitledEditorService private untitledEditorService: IUntitledEditorService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService) {
    }

    // file extensions that should be put into query editors
    private static fileTypes = ['SQL'];

    /**
     * Creates new untitled document for SQL query and opens in new editor tab
     */
    public newSqlEditor(): Promise<URI> {

        return new Promise<URI>((resolve, reject) => {
            try {
				// Create file path and file URI
                let filePath = this.createUntitledSqlFilePath();
                let docUri: URI = URI.parse(filePath);

				// Create a sql document pane with accoutrements
				let fileInput = this.untitledEditorService.createOrGet(docUri);
				const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput);
				let queryInput: QueryInput = this.instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
				this.editorService.openEditor(queryInput, { pinned: true });

				resolve(docUri);
            } catch (error) {
                reject(error);
            }
        });
    }

    private createUntitledSqlFilePath(): string {
        let sqlFileName = (counter: number): string => {
            return `SQLQuery${counter}.sql`;
        }

		let counter = 1;
		// Get document name and check if it exists
        let filePath = sqlFileName(counter);
        while (fs.existsSync(filePath)) {
            counter++;
            filePath = sqlFileName(counter);
        }

		// check if this document name already exists in any open documents
		let untitledEditors = this.untitledEditorService.getAll();
        while (untitledEditors.find(x => x.getName().toUpperCase() === filePath.toUpperCase())) {
            counter++;
            filePath = sqlFileName(counter);
        }

        return filePath;
    }

    // These functions are static to reduce extra lines needed in editorService.ts (Vscode code base)
    public static queryEditorCheck(fileInput: EditorInput, instService: IInstantiationService): EditorInput {
        if (!!fileInput && this.isQueryEditorFile(fileInput)) {
            const queryResultsInput: QueryResultsInput = instService.createInstance(QueryResultsInput);
            let queryInput: QueryInput = instService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
            return queryInput;
        }

        return fileInput;
    }

    private static isQueryEditorFile(fileInput: EditorInput): boolean {
        let lastPeriodIndex = fileInput.getName().lastIndexOf('.');

        // if this editor is not already of type queryinput and there is a file extension
        if (!(fileInput instanceof QueryInput) && lastPeriodIndex > -1) {
            // parse the file extension
            let extension: string = fileInput.getName().substr(lastPeriodIndex+1).toUpperCase();
            // if it is supported then return true
            if(!!this.fileTypes.find(x => x === extension)){
                return true;
            }
        }

        return false;
    }

}

