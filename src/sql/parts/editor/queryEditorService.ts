/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from 'vs/workbench/common/editor';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import URI from 'vs/base/common/uri';
import { IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
const fs = require('fs');

export const IQueryEditorService = createDecorator<QueryEditorService>('QueryEditorService');

export interface IQueryEditorService {
	_serviceBrand: any;

	// opens a new sql editor and returns its URI
	newSqlEditor(sqlContent?: string): Promise<IConnectableInput>;

	// opens a new data editor and returns its URI
	newEditDataEditor(tableName: string): Promise<IConnectableInput>;
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
	public newSqlEditor(sqlContent?: string): Promise<IConnectableInput> {
		return new Promise<IConnectableInput>((resolve, reject) => {
			try {
				// Create file path and file URI
				let filePath = this.createUntitledSqlFilePath();
				let docUri: URI = URI.from({ scheme: UntitledEditorInput.SCHEMA, path: filePath });

				// Create a sql document pane with accoutrements
				const fileInput = this.untitledEditorService.createOrGet(docUri, 'sql');
				fileInput.resolve().then(m => {
					if (sqlContent) {
						m.textEditorModel.setValue(sqlContent);
					}
				});

				//input.resolve().then(model => this.backupFileService.backupResource(resource, model.getValue(), model.getVersionId())).done(null, errors.onUnexpectedError);

				const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput, docUri.toString());
				let queryInput: QueryInput = this.instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);

				this.editorService.openEditor(queryInput, { pinned: true })
				.then((editor) => {
					let params = <QueryInput>editor.input;
					resolve(params);
				}, (error) => {
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Creates new edit data session
	 */
	public newEditDataEditor(tableName: string): Promise<IConnectableInput> {

		return new Promise<IConnectableInput>((resolve, reject) => {
			try {
				// Create file path and file URI
				let filePath = this.createEditDataFileName(tableName);
				let docUri: URI = URI.from({ scheme: UntitledEditorInput.SCHEMA, path: filePath });

				// Create an EditDataInput for editing
				let editDataInput: EditDataInput = this.instantiationService.createInstance(EditDataInput, docUri, tableName);

				this.editorService.openEditor(editDataInput, { pinned: true })
				.then((editor) => {
					let params = <EditDataInput>editor.input;
					resolve(params);
				}, (error) => {
					reject(error);
				});
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
		let editDataFileName = (counter: number): string => {
			return `${tableName}_${counter}`;
		};

		let counter = 1;
		// Get document name and check if it exists
		let filePath = editDataFileName(counter);
		while (fs.existsSync(filePath)) {
			counter++;
			filePath = editDataFileName(counter);
		}

		// TODO: check if this document name already exists in any open documents tabs

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
