/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from 'vs/workbench/common/editor';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import URI from 'vs/base/common/uri';
const fs = require('fs');


export const IQueryEditorService = createDecorator<QueryEditorService>('QueryEditorService');


export interface IQueryEditorService {
	_serviceBrand: any;

	// opens a new sql editor and returns its URI
	newSqlEditor(): Promise<URI>;

	// opens a new data editor and returns its URI
	newEditDataEditor(tableName: string): Promise<URI>;
}

/**
 * Service wrapper for opening and creating SQL documents as sql editor inputs
 */
export class QueryEditorService implements IQueryEditorService {
	public _serviceBrand: any;
	// file extensions that should be put into query editors
	private static fileTypes = ['SQL'];
	// prefic for untitled sql editors
	private static untitledFilePrefix = 'SQLQuery';

	constructor(
		@IUntitledEditorService private untitledEditorService: IUntitledEditorService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService) {
	}

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
				const fileInput = this.untitledEditorService.createOrGet(docUri, 'sql');
				const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput, docUri.toString());
				let queryInput: QueryInput = this.instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
				this.editorService.openEditor(queryInput, { pinned: true });

				resolve(docUri);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Creates new edit data session
	 */
	public newEditDataEditor(tableName: string): Promise<URI> {

		return new Promise<URI>((resolve, reject) => {
			try {
				// Create file path and file URI
				let filePath = this.createEditDataFileName(tableName);
				let docUri: URI = URI.parse(filePath);

				// Create a sql document pane with accoutrements
				const fileInput = this.untitledEditorService.createOrGet(docUri);
				const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput, docUri.toString());
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
			return `${QueryEditorService.untitledFilePrefix}${counter}`;
		};

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

	private createEditDataFileName(tableName: string): string {
		let sqlFileName = (counter: number): string => {
			return `${tableName} ${counter}`;
		};

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
        if (!!fileInput) {

            let uri: string = this.getQueryEditorFileUri(fileInput);
            if (!!uri) {
                const queryResultsInput: QueryResultsInput = instService.createInstance(QueryResultsInput, uri);
                let queryInput: QueryInput = instService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
                return queryInput;
            }
        }

        return fileInput;
    }

    /**
     * If fileInput is a supported query editor file, return it's URI. Otherwise return undefined.
     */
    private static getQueryEditorFileUri(fileInput: EditorInput): string {
        if (!fileInput || !fileInput.getName()) {
            return undefined;
        }

        // if this editor is not already of type queryinput and there is a file extension
        if (!(fileInput instanceof QueryInput)) {

            // if it is supported and we can get the URI, return the URI
            // there is no interface containing getResource, so we must do a typeof check
            let fileInputCast: any = <any> fileInput;
            if (!!this.isQueryEditorFile(fileInput) && typeof fileInputCast.getResource === 'function') {
                let uri: URI = fileInputCast.getResource();
                if (!!uri && !!uri.toString()) {
                    return uri.toString();
                }
            }
        }

        return undefined;
    }

	private static isQueryEditorFile(fileInput: EditorInput): boolean {
		// Check the extension type
		let lastPeriodIndex = fileInput.getName().lastIndexOf('.');
		if(lastPeriodIndex > -1) {
			let extension: string = fileInput.getName().substr(lastPeriodIndex+1).toUpperCase();
			return !!this.fileTypes.find(x => x === extension);
		}

		// Check for untitled file type
		if (fileInput.getName().includes(this.untitledFilePrefix)) {
			return true;
		}

		// Return false if not a queryEditor file
		return false;
	}

}
