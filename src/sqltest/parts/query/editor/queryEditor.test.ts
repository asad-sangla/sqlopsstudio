/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { EditorDescriptorService } from 'sql/parts/query/editor/editorDescriptorService';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { IMessageService } from 'vs/platform/message/common/message';
import { TestMessageService } from 'vs/workbench/test/workbenchTestServices';
import { IEditorDescriptor, EditorInput } from 'vs/workbench/common/editor';
import { TPromise } from 'vs/base/common/winjs.base';
import URI from 'vs/base/common/uri';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryModelService } from 'sql/parts/query/execution/queryModelService';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { Builder } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('SQL QueryEditor Tests', () => {
	let queryModelService: QueryModelService;
	let instantiationService: TypeMoq.Mock<InstantiationService>;
	let messageService: TypeMoq.Mock<IMessageService>;
	let editorDescriptorService: TypeMoq.Mock<EditorDescriptorService>;
	let queryInput: QueryInput;
	let queryInput2: QueryInput;
	let parentBuilder: Builder;
	let mockEditor: any;

	setup(() => {
		// Setup DOM elements
		let element = DOM.$('queryEditorParent');
		parentBuilder = new Builder(element);

		// Create object to mock the Editor classes
		// QueryResultsEditor fails at runtime due to the way we are importing Angualar,
		// so a {} mock is used here. This mock simply needs to have empty method stubs
		// for all called runtime methods
		mockEditor = {
			_bootstrapAngular: function () { },
			setInput: function () { },
			createEditor: function () { },
			create: function () { },
			setVisible: function () { },
			layout: function () { },
			dispose: function () { }
		};

		// Mock InstantiationService to give us our mockEditor
		instantiationService = TypeMoq.Mock.ofType(InstantiationService, TypeMoq.MockBehavior.Loose);
		instantiationService.setup(x => x.createInstance(TypeMoq.It.isAny())).returns((input) => {
			return new TPromise((resolve) => resolve(mockEditor));
		});

		// Mock EditorDescriptorService to give us a mock editor description
		let descriptor: IEditorDescriptor = {
			getId: function (): string { return 'id'; },
			getName: function (): string { return 'name'; },
			describes: function (obj: any): boolean { return true; }
		};
		editorDescriptorService = TypeMoq.Mock.ofType(EditorDescriptorService, TypeMoq.MockBehavior.Loose);
		editorDescriptorService.setup(x => x.getEditor(TypeMoq.It.isAny())).returns(() => descriptor);

		// Create a QueryInput
		let filePath = 'someFile.sql';
		let uri: URI = URI.parse(filePath);
		let fileInput = new UntitledEditorInput(uri, false, '', instantiationService.object, undefined, undefined);
		let queryResultsInput: QueryResultsInput = new QueryResultsInput(uri.fsPath);
		queryInput = new QueryInput('first', 'first', fileInput, queryResultsInput, undefined);

		// Create a QueryInput to compare to the previous one
		let filePath2 = 'someFile2.sql';
		let uri2: URI = URI.parse(filePath2);
		let fileInput2 = new UntitledEditorInput(uri2, false, '', instantiationService.object, undefined, undefined);
		let queryResultsInput2: QueryResultsInput = new QueryResultsInput(uri2.fsPath);
		queryInput2 = new QueryInput('second', 'second', fileInput2, queryResultsInput2, undefined);

		// Mock IMessageService
		messageService = TypeMoq.Mock.ofType(TestMessageService, TypeMoq.MockBehavior.Loose);

		// Create a QueryModelService
		queryModelService = new QueryModelService(instantiationService.object, messageService.object);
	});

	test('createEditor creates only the taskbar', (done) => {
		// If I call createEditor
		let editor: QueryEditor = new QueryEditor(undefined, instantiationService.object, undefined, undefined, queryModelService, editorDescriptorService.object);
		editor.createEditor(parentBuilder);

		// The taskbar should be created
		assert.equal(!!editor.taskbar, true);
		assert.equal(!!editor.taskbarContainer, true);

		// But Nothing else should be created
		assert.equal(!!editor.getContainer(), false);
		assert.equal(!!editor.sqlEditor, false);
		assert.equal(!!editor.sqlEditorContainer, false);
		assert.equal(!!editor.resultsEditor, false);
		assert.equal(!!editor.resultsEditorContainer, false);
		assert.equal(!!editor.sash, false);
		assert.equal(!!editor._isResultsEditorVisible(), false);
		done();
	});

	test('setInput creates SQL components', (done) => {
		let assertInput = function () {
			// The taskbar SQL, and parent should be created
			assert.equal(!!editor.taskbar, true);
			assert.equal(!!editor.taskbarContainer, true);
			assert.equal(!!editor.getContainer(), true);
			assert.equal(!!editor.sqlEditor, true);
			assert.equal(!!editor.sqlEditorContainer, true);

			// But the results componenets should not
			assert.equal(!!editor.resultsEditor, false);
			assert.equal(!!editor.resultsEditorContainer, false);
			assert.equal(!!editor.sash, false);
			assert.equal(!!editor._isResultsEditorVisible(), false);
		};

		// If I call create a QueryEditor
		let editor: QueryEditor = new QueryEditor(undefined, instantiationService.object, undefined, undefined, queryModelService, editorDescriptorService.object);
		editor.create(parentBuilder);

		return editor.setInput(queryInput) 	// Then I set the input
			.then(assertInput) 	// Only the taskbar SQL, and parent should be created
			.then(() => done(), (err) => done(err));
	});

	test('showQueryResultsEditor creates all components', (done) => {
		// Setup
		let showQueryResultsEditor = function () {
			return editor.showQueryResultsEditor();
		};

		let assertInput = function () {
			assert.equal(!!editor.taskbar, true);
			assert.equal(!!editor.taskbarContainer, true);
			assert.equal(!!editor.getContainer(), true);
			assert.equal(!!editor.sqlEditor, true);
			assert.equal(!!editor.sqlEditorContainer, true);
			assert.equal(!!editor.resultsEditor, true);
			assert.equal(!!editor.resultsEditorContainer, true);
			assert.equal(!!editor.sash, true);
			assert.equal(!!editor._isResultsEditorVisible(), true);
		};

		// If I create a QueryEditor
		let editor: QueryEditor = new QueryEditor(undefined, instantiationService.object, undefined, undefined, queryModelService, editorDescriptorService.object);
		editor.create(parentBuilder);

		return editor.setInput(queryInput) // Then I set the input
			.then(showQueryResultsEditor) // Then call showQueryResultsEditor
			.then(assertInput) // Both editor windows should be created
			.then(() => done(), (err) => done(err));
	});

	test('Can switch between different input files', (done) => {
		// Setup
		let firstInput: EditorInput;
		let firstContainer: HTMLElement;
		let secondInput: EditorInput;
		let secondContainer: HTMLElement;
		const firstContainerId = 'firstContainerId';
		const secondContainerId = 'secondContainerId';

		let recordFirstInput = function () {
			let input = <QueryInput>editor.input;
			firstInput = input.sql;
			firstContainer = editor.sqlEditorContainer;
			firstContainer.id = firstContainerId;
		};

		let assertFirstInputIsSet = function () {
			assert.notEqual(firstContainer.parentElement, undefined);
		};

		let setSecondInput = function () {
			return editor.setInput(queryInput2);
		};

		let assertFirstInputIsRemoved = function () {
			let input = <QueryInput>editor.input;
			secondInput = input.sql;
			secondContainer = editor.sqlEditorContainer;
			secondContainer.id = secondContainerId;

			// The inputs should not match
			assert.notEqual(firstInput.getName(), secondInput.getName());
			assert.notEqual(firstContainer.id, secondContainer.id);
			assert.equal(firstContainer.id, firstContainerId);

			// The first input should be disposed
			assert.notEqual(firstContainer.parentElement, secondContainer.parentElement);
			assert.equal(firstContainer.parentElement, undefined);

			// The second input should be added into the DOM
			assert.notEqual(secondContainer.parentElement, undefined);
		};

		let setFirstInputAgain = function () {
			return editor.setInput(queryInput);
		};

		let assertFirstInputIsAddedBack = function () {
			let input = <QueryInput>editor.input;
			firstInput = input.sql;
			firstContainer = editor.sqlEditorContainer;

			// The inputs should not match
			assert.notEqual(firstInput.getName(), secondInput.getName());
			assert.notEqual(firstContainer.id, secondContainer.id);
			assert.equal(secondContainer.id, secondContainerId);

			// The first input should be added into the DOM
			assert.equal(secondContainer.parentElement, undefined);

			// The second input should be disposed
			assert.notEqual(firstContainer.parentElement, secondContainer.parentElement);
			assert.notEqual(firstContainer.parentElement, undefined);
		};


		// If I create a QueryEditor
		let editor: QueryEditor = new QueryEditor(undefined, instantiationService.object, undefined, undefined, queryModelService, editorDescriptorService.object);
		editor.create(parentBuilder);

		return editor.setInput(queryInput) // and I set the input
			.then(recordFirstInput) // then I record what the input is
			.then(assertFirstInputIsSet) // the input should be set
			.then(setSecondInput) // then if I set the input to a new file
			.then(assertFirstInputIsRemoved) // the inputs should not match, and the first input should be removed from the DOM
			.then(setFirstInputAgain) // then if I set the input back to the original
			.then(assertFirstInputIsAddedBack) // the inputs should not match, and the second input should be removed from the DOM
			.then(() => done(), (err) => done(err));
	});
});