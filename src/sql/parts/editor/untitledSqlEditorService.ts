/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import URI from 'vs/base/common/uri';
const fs = require('fs');

/**
 * Service for creating untitled documents for SQL query
 */
export default class UntitledSqlEditorService {

    constructor(
		@IUntitledEditorService private untitledEditorService: IUntitledEditorService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService) {
    }

    /**
     * Creates new untitled document for SQL query and opens in new editor tab
     */
    public newDocument(): Promise<URI> {

        return new Promise<URI>((resolve, reject) => {
            try {
				// Create file path and file URI
                let filePath = this.createUntitledFilePath();
                let docUri: URI = URI.parse(filePath);

				// Create a sql document pane with accoutrements
				const fileInput = this.untitledEditorService.createOrGet(docUri);
				const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput);
				let queryInput: QueryInput = this.instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
				this.editorService.openEditor(queryInput, { pinned: true });

				resolve(docUri);
            } catch (error) {
                reject(error);
            }
        });
    }

    private createUntitledFilePath(): string {
		let counter = 1;
		// Get document name and check if it exists
        let filePath = UntitledSqlEditorService.createFilePath(counter);
        while (fs.existsSync(filePath)) {
            counter++;
            filePath = UntitledSqlEditorService.createFilePath(counter);
        }

		// check if this document name already exists in any open documents
		let untitledEditors = this.untitledEditorService.getAll();
        while (untitledEditors.find(x => x.getName().toUpperCase() === filePath.toUpperCase())) {
            counter++;
            filePath = UntitledSqlEditorService.createFilePath(counter);
        }

        return filePath;
    }

    public static createFilePath(counter: number): string {
        return `SQLQuery${counter}.sql`;
    }
}

