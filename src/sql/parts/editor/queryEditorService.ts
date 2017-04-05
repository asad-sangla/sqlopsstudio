/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from 'vs/workbench/common/editor';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { createDecorator, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import URI from 'vs/base/common/uri';
import { IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { IEditorInput } from 'vs/platform/editor/common/editor';

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

	// prefix for untitled sql editors
	private static untitledFilePrefix = 'SQLQuery';

	// mode identifier for SQL mode
	private static sqlModeId = 'sql';

	constructor(
		@IUntitledEditorService private untitledEditorService: IUntitledEditorService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IEditorGroupService private editorGroupService: IEditorGroupService) {
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
		let fileNames: string[] = [];
		this.editorGroupService.getStacksModel().groups.map(group => group.getEditors().map(editor => fileNames.push(editor.getName())));
		while (fileNames.find(x => x.toUpperCase() === filePath.toUpperCase())) {
			counter++;
			filePath = editDataFileName(counter);
		}

		return filePath;
	}

	// These functions are static to reduce extra lines needed in editorService.ts (Vscode code base)
	public static queryEditorCheck(input: EditorInput, instService: IInstantiationService): EditorInput {
		if (!!input) {

			let uri: string = this.getQueryEditorFileUri(input);
			if (!!uri) {
				const queryResultsInput: QueryResultsInput = instService.createInstance(QueryResultsInput, uri);
				let queryInput: QueryInput = instService.createInstance(QueryInput, input.getName(), '', input, queryResultsInput);
				return queryInput;
			}
		}

		return input;
	}

	/**
	 * If fileInput is a supported query editor file, return it's URI. Otherwise return undefined.
	 */
	private static getQueryEditorFileUri(input: EditorInput): string {
		if (!input || !input.getName()) {
			return undefined;
		}

		// If this editor is not already of type queryinput
		if (!(input instanceof QueryInput)) {

			// If this editor has a URI
			let uri: URI = this.getInputResource(input);
			if (uri) {
				let isValidUri = !!uri && !!uri.toString;
				let isValidInput = this.isQueryEditorFile(input) || this.isUntitledFile(uri);
				if (isValidUri && isValidInput) {
					return uri.toString();
				}
			}
		}

		return undefined;
	}

	private static getInputResource(input: EditorInput): URI {
		if (input instanceof UntitledEditorInput) {
			let untitledCast: UntitledEditorInput = <UntitledEditorInput> input;
			if (untitledCast) {
				return untitledCast.getResource();
			}
		}

		if (input instanceof FileEditorInput) {
			let fileCast: FileEditorInput  = <FileEditorInput > input;
			if (fileCast) {
				return fileCast.getResource();
			}
		}

		return undefined;
	}

	private static isUntitledFile(uri: URI): boolean {
		if (uri) {
			return uri.scheme === UntitledEditorInput.SCHEMA;
		}
		return false;
	}

	private static canSetModeToSql(input: IEditorInput): boolean {
		if (input) {
			let fileInputCast: any = <any>input;
			if (fileInputCast && fileInputCast.hasOwnProperty('modeId')) {
				fileInputCast.modeId = this.sqlModeId;
				return true;
			}
		}
		return false;
	}

	private static doSetModeToSql(input: IEditorInput): void {
		let fileInputCast: any = <any>input;
		fileInputCast.modeId = this.sqlModeId;
	}

	private static isQueryEditorFile(input: EditorInput): boolean {
		// Check the extension type
		let lastPeriodIndex = input.getName().lastIndexOf('.');
		if (lastPeriodIndex > -1) {
			let extension: string = input.getName().substr(lastPeriodIndex + 1).toUpperCase();
			return !!this.fileTypes.find(x => x === extension);
		}

		// Check for untitled file type
		if (input.getName().includes(this.untitledFilePrefix)) {
			return true;
		}

		// Return false if not a queryEditor file
		return false;
	}

}
