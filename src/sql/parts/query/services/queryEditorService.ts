/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput, IEditorGroup } from 'vs/workbench/common/editor';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { FileEditorInput } from 'vs/workbench/parts/files/common/editors/fileEditorInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { EditDataInput } from 'sql/parts/editData/common/editDataInput';
import URI from 'vs/base/common/uri';
import { IConnectableInput } from 'sql/parts/connection/common/connectionManagement';
import { IEditorGroupService } from 'vs/workbench/services/group/common/groupService';
import { IMode } from 'vs/editor/common/modes';
import { IModel } from 'vs/editor/common/editorCommon';
import { IEditor, IEditorInput, Position } from 'vs/platform/editor/common/editor';
import { CodeEditor } from 'vs/editor/browser/codeEditor';
import { IQueryEditorService, IQueryEditorOptions } from 'sql/parts/query/common/queryEditorService';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import nls = require('vs/nls');

const fs = require('fs');

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

	private static CHANGE_ERROR_MESSAGE = nls.localize(
		'queryEditorServiceChangeError',
		'Please save or discard changes before switching to/from the SQL Language Mode'
	);

	// files that should open in SQL mode but will not do so by default
	private static sqlModeFiles: Set<string>;

	// service references for static functions
	private static editorService: IWorkbenchEditorService;
	private static instantiationService: IInstantiationService;
	private static editorGroupService: IEditorGroupService;
	private static messageService: IMessageService;

	constructor(
		@IUntitledEditorService private _untitledEditorService: IUntitledEditorService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IWorkbenchEditorService private _editorService: IWorkbenchEditorService,
		@IEditorGroupService private _editorGroupService: IEditorGroupService,
		@IMessageService private _messageService: IMessageService,
	) {
		QueryEditorService.editorService = _editorService;
		QueryEditorService.instantiationService = _instantiationService;
		QueryEditorService.editorGroupService = _editorGroupService;
		QueryEditorService.messageService = _messageService;
		QueryEditorService.sqlModeFiles = new Set<string>();
	}

	////// Public functions

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
				const fileInput = this._untitledEditorService.createOrGet(docUri, 'sql');
				fileInput.resolve().then(m => {
					if (sqlContent) {
						m.textEditorModel.setValue(sqlContent);
					}
				});

				//input.resolve().then(model => this.backupFileService.backupResource(resource, model.getValue(), model.getVersionId())).done(null, errors.onUnexpectedError);

				const queryResultsInput: QueryResultsInput = this._instantiationService.createInstance(QueryResultsInput, docUri.toString());
				let queryInput: QueryInput = this._instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);

				this._editorService.openEditor(queryInput, { pinned: true })
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
	public newEditDataEditor(schemaName: string, tableName: string): Promise<IConnectableInput> {

		return new Promise<IConnectableInput>((resolve, reject) => {
			try {
				// Create file path and file URI
				let objectName = schemaName ? schemaName + '.' + tableName : tableName;
				let filePath = this.createEditDataFileName(objectName);
				let docUri: URI = URI.from({ scheme: UntitledEditorInput.SCHEMA, path: filePath });

				// Create an EditDataInput for editing
				let editDataInput: EditDataInput = this._instantiationService.createInstance(EditDataInput, docUri, schemaName, tableName);

				this._editorService.openEditor(editDataInput, { pinned: true })
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

	/**
	 * Clears any QueryEditor data for the given URI held by this service
	 */
	public onQueryInputClosed(uri: string): void {
		QueryEditorService.sqlModeFiles.delete(uri);
	}

	////// Public static functions
	// These functions are static to reduce extra lines needed in the vscode code base

	/**
	 * Checks if the Language Mode is being changed to/from SQL. If so, swaps out the input of the
	 * given editor with a new input, opens a new editor, then returns the new editor's IModel.
	 *
	 * Returns an immediately resolved promise if the SQL Language mode is not involved. In this case,
	 * the calling function in editorStatus.ts will handle the language change normally.
	 *
	 * Returns an immediately resolved promise with undefined if SQL is involved in the language change
	 * and the editor is dirty. In this case, the calling function in editorStatus.ts will not perform
	 * the language change. TODO: change this -  tracked by issue #727
	 *
	 * In all other cases (when SQL is involved in the language change and the editor is not dirty),
	 * returns a promise that will resolve when the old editor has been replaced by a new editor.
	 */
	public static sqlLanguageModeCheck(model: IModel, mode: IMode, editor: IEditor): Promise<IModel> {
		if (!model || !mode || !editor) {
			return Promise.resolve(undefined);
		}

		let newLanguage: string = mode.getLanguageIdentifier().language;
		let oldLanguage: string = model.getLanguageIdentifier().language;
		let changingToSql = QueryEditorService.sqlModeId === newLanguage;
		let changingFromSql = QueryEditorService.sqlModeId === oldLanguage;
		let changingLanguage = newLanguage !== oldLanguage;

		if (!changingLanguage) {
			return Promise.resolve(model);
		}
		if (!changingFromSql && !changingToSql) {
			return Promise.resolve(model);
		}

		// Return undefined to notify the calling funciton to not perform the language change
		// TODO change this - tracked by issue #727
		if (editor.input.isDirty()) {
			QueryEditorService.messageService.show(Severity.Error, QueryEditorService.CHANGE_ERROR_MESSAGE);
			return Promise.resolve(undefined);
		}

		let group: IEditorGroup = QueryEditorService.editorGroupService.getStacksModel().groupAt(editor.position);
		let index: number = group.indexOf(editor.input);
		let position: Position = editor.position;
		let options: IQueryEditorOptions = editor.options ? editor.options : {};
		options.index = index;
		options.pinned = group.isPinned(index);

		// Return a promise that will resovle when the old editor has been replaced by a new editor
		return new Promise<IModel>((resolve, reject) => {
			let uri: URI = QueryEditorService._getEditorChangeUri(editor.input, changingToSql);
			let newEditorInput = QueryEditorService._getNewEditorInput(changingToSql, editor.input, uri);

			// Override queryEditorCheck to not open this file in a QueryEditor
			if (!changingToSql) {
				options.denyQueryEditor = true;
			}

			// Close the current editor
			QueryEditorService.editorService.closeEditor(position, editor.input).then(() =>	{

				// Reopen a new editor in the same position/index
				QueryEditorService.editorService.openEditor(newEditorInput, options, position).then((editor) =>	{
					resolve(QueryEditorService._onEditorOpened(editor, uri.toString(), position, options.pinned));
				},
				(error) => {
					reject(error);
				});
			});
		});
	}

	/**
	 * Checks if this input/options pair should actually open as a QueryInput. If so, returns same input wrapped
	 * inside a QueryInput.
	 */
	public static queryEditorCheck(input: EditorInput, options: IQueryEditorOptions): EditorInput {
		let denyQueryEditor = options && options.denyQueryEditor;
		if (input && !denyQueryEditor) {
			let uri: string = this.getQueryEditorFileUri(input);
			if (uri) {
				const queryResultsInput: QueryResultsInput = QueryEditorService.instantiationService.createInstance(QueryResultsInput, uri);
				let queryInput: QueryInput = QueryEditorService.instantiationService.createInstance(QueryInput, input.getName(), '', input, queryResultsInput);
				return queryInput;
			}
		}

		return input;
	}

	////// Private functions

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
		let untitledEditors = this._untitledEditorService.getAll();
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
		this._editorGroupService.getStacksModel().groups.map(group => group.getEditors().map(editor => fileNames.push(editor.getName())));
		while (fileNames.find(x => x.toUpperCase() === filePath.toUpperCase())) {
			counter++;
			filePath = editDataFileName(counter);
		}

		return filePath;
	}

	////// Private static functions

	/**
	 * Returns a QueryInput if we are changingToSql. Returns a FileEditorInput if we are !changingToSql.
	 */
	private static _getNewEditorInput(changingToSql: boolean, input: IEditorInput, uri: URI): IEditorInput {
		if (!uri) {
			return undefined;
		}

		let newEditorInput: IEditorInput = undefined;
		if (changingToSql) {
			const queryResultsInput: QueryResultsInput = QueryEditorService.instantiationService.createInstance(QueryResultsInput, uri.toString());
			let queryInput: QueryInput = QueryEditorService.instantiationService.createInstance(QueryInput, input.getName(), '', input, queryResultsInput);
			newEditorInput = queryInput;
		} else {
			let uriCopy: URI = URI.from( { scheme: uri.scheme, authority: uri.authority, path: uri.path, query: uri.query, fragment: uri.fragment } );
			newEditorInput = QueryEditorService.instantiationService.createInstance(FileEditorInput, uriCopy, undefined);
		}

		return newEditorInput;
	}

	/**
	 * Gets the URI for this IEditorInput or returns undefined if one does not exist.
	 */
	private static _getEditorChangeUri(input: IEditorInput, changingToSql: boolean): URI {
		let uriSource: IEditorInput = input;

		// It is assumed that if we got here, !changingToSql is logically equivalent to changingFromSql
		let changingFromSql = !changingToSql;
		if (input instanceof QueryInput && changingFromSql) {
			let queryInput: QueryInput = <QueryInput> input;
			uriSource = queryInput.sql;
		}
		return QueryEditorService._getInputResource(uriSource);
	}

	/**
	 * Handle all cleanup actions that need to wait until the editor is fully open.
	 */
	private static _onEditorOpened(editor: IEditor, uri: string, position: Position, isPinned: boolean): IModel {

		// Reset the editor pin state
		// TODO: change this so it happens automatically in openEditor in sqlLanguageModeCheck. Performing this here
		// causes the text on the tab to slightly flicker for unpinned files (from non-italic to italic to non-italic).
		// This is currently unavoidable because vscode ignores "pinned" on IEditorOptions if "index" is not undefined,
		// and we need to specify "index"" so the editor tab remains in the same place
		let group: IEditorGroup = QueryEditorService.editorGroupService.getStacksModel().groupAt(position);
		if (isPinned) {
			QueryEditorService.editorGroupService.pinEditor(group, editor.input);
		} else {
			QueryEditorService.editorGroupService.unpinEditor(group, editor.input);
		}

		// Record this URI in the QueryEditorService.sqlModeFiles map so we remember to open it with the correct editor.
		if (editor.input instanceof QueryInput) {
			QueryEditorService.sqlModeFiles.add(uri);
		} else {
			QueryEditorService.sqlModeFiles.delete(uri);
		}

		// Grab and returns the IModel that will be used to resolve the sqlLanguageModeCheck promise.
		let control = editor.getControl();
		let codeEditor: CodeEditor = <CodeEditor> control;
		let newModel = codeEditor ? codeEditor.getModel() : undefined;
		return newModel;
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
			let uri: URI = this._getInputResource(input);
			if (uri) {
				let isValidUri: boolean = !!uri && !!uri.toString;

				if (isValidUri && (this._hasSqlFileExtension(input) || this._hasSqlFileMode(input) || QueryEditorService.sqlModeFiles.has(uri.toString()) )
				) {
					return uri.toString();
				}
			}
		}

		return undefined;
	}

	private static _getInputResource(input: IEditorInput): URI {
		if (input instanceof UntitledEditorInput) {
			let untitledCast: UntitledEditorInput = <UntitledEditorInput> input;
			if (untitledCast) {
				return untitledCast.getResource();
			}
		}

		if (input instanceof FileEditorInput) {
			let fileCast: FileEditorInput  = <FileEditorInput> input;
			if (fileCast) {
				return fileCast.getResource();
			}
		}

		return undefined;
	}

	private static _hasSqlFileMode(input: EditorInput): boolean {
		if (input instanceof UntitledEditorInput) {
			let untitledCast: UntitledEditorInput = <UntitledEditorInput> input;
			return untitledCast && (untitledCast.getModeId() === undefined || untitledCast.getModeId() === this.sqlModeId);
		}

		return false;
	}

	private static _hasSqlFileExtension(input: EditorInput): boolean {
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
