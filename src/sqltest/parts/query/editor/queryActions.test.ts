/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { IConnectionManagementService, ConnectionType, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import { ConnectionDialogService } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { RunQueryAction, CancelQueryAction, ListDatabasesActionItem,
	DisconnectDatabaseAction, ConnectDatabaseAction, QueryTaskbarAction
} from 'sql/parts/query/execution/queryActions';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { TestEditorGroupService } from 'vs/workbench/test/workbenchTestServices';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { QueryEditor } from 'sql/parts/query/editor/queryEditor';
import { QueryModelService } from 'sql/parts/query/execution/queryModelService';
import { ConnectionManagementService } from 'sql/parts/connection/node/connectionManagementService';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('SQL QueryAction Tests', () => {

	let testUri: string = 'testURI';
	let editor: TypeMoq.Mock<QueryEditor>;
	let calledShowQueryResultsEditor: boolean = undefined;
	let testQueryInput: TypeMoq.Mock<QueryInput>;

	setup(() => {
		testQueryInput = TypeMoq.Mock.ofType(QueryInput, TypeMoq.MockBehavior.Strict);
		testQueryInput.setup(x => x.uri).returns(() => testUri);
		testQueryInput.setup(x => x.runQuery()).callback(() => {
			calledShowQueryResultsEditor = true;
		});

		editor = TypeMoq.Mock.ofType(QueryEditor, TypeMoq.MockBehavior.Strict);
		editor.setup(x => x.currentQueryInput).returns(() => testQueryInput.object);
	});

	test('setClass sets child CSS class correctly', (done) => {
		// If I create a RunQueryAction
		let queryAction: QueryTaskbarAction = new RunQueryAction(undefined, undefined, undefined, undefined);

		// "class should automatically get set to include the base class and the RunQueryAction class
		let className = QueryTaskbarAction.BaseClass + ' ' + RunQueryAction.EnabledClass;
		assert.equal(queryAction.class, className, 'CSS class not properly set');
		done();
	});

	test('getConnectedQueryEditorUri returns connected URI only if connected', (done) => {
		// ... Create assert variables
		let isConnectedReturnValue: boolean = false;

		// ... Mock "isConnected in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {});
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnectedReturnValue);

		// ... Create an editor
		let editor = TypeMoq.Mock.ofType(QueryEditor, TypeMoq.MockBehavior.Loose);
		editor.setup(x => x.currentQueryInput).returns(() => testQueryInput.object);

		// If I create a QueryTaskbarAction and I pass a non-connected editor to _getConnectedQueryEditorUri
		let queryAction: QueryTaskbarAction = new RunQueryAction(undefined, undefined, connectionManagementService.object, undefined);
		let connected: boolean = queryAction.isConnected(editor.object);

		// I should get an unconnected state
		assert(!connected, 'Non-connected editor should get back an undefined URI');

		// If I run with a connected URI
		isConnectedReturnValue = true;
		connected = queryAction.isConnected(editor.object);

		// I should get a connected state
		assert(connected, 'Connected editor should get back a non-undefined URI');
		done();
	});

	test('RunQueryAction calls runQuery() and showQueryResultsEditor() only if URI is connected', (done) => {
		// ... Create assert variables
		let isConnected: boolean = undefined;
		let connectionParams: INewConnectionParams = undefined;
		let calledRunQuery: boolean = false;
		let countCalledShowDialog: number = 0;

		// ... Mock "showDialog" ConnectionDialogService
		let connectionDialogService = TypeMoq.Mock.ofType(ConnectionDialogService, TypeMoq.MockBehavior.Loose);
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined))
		.callback((service: IConnectionManagementService, params: INewConnectionParams) => {
			connectionParams = params;
			countCalledShowDialog++;
		});

		// ... Mock "isConnected" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {}, connectionDialogService.object);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);

		// ... Mock QueryModelService
		let queryModelService = TypeMoq.Mock.ofType(QueryModelService, TypeMoq.MockBehavior.Loose);
		queryModelService.setup(x => x.runQuery(TypeMoq.It.isAny(), undefined, TypeMoq.It.isAny())).callback(() => {
			calledRunQuery = true;
		});

		let editorGroupService = TypeMoq.Mock.ofType(TestEditorGroupService, TypeMoq.MockBehavior.Loose);
		editorGroupService.setup(x => x.pinEditor(TypeMoq.It.isAny(), TypeMoq.It.isAny())).callback(() => {
		});

		// If I call run on RunQueryAction when I am not connected
		let queryAction: RunQueryAction = new RunQueryAction(editor.object, queryModelService.object, connectionManagementService.object, editorGroupService.object);
		isConnected = false;
		calledShowQueryResultsEditor = false;
		queryAction.run();

		// showQueryResultsEditor and runQuery should not be run
		assert.equal(calledShowQueryResultsEditor, false, 'run should not call showQueryResultsEditor');
		testQueryInput.verify(x => x.runQuery(), TypeMoq.Times.never());

		// and the conneciton dialog should open with the correct parameter details
		assert.equal(countCalledShowDialog, 1, 'run should call showDialog');
		assert.equal(connectionParams.connectionType, ConnectionType.queryEditor, 'connectionType should be queryEditor');
		assert.equal(connectionParams.runQueryOnCompletion, true, 'runQueryOnCompletion should be true`');
		assert.equal(connectionParams.input.uri, testUri, 'URI should be set to the test URI');
		assert.equal(connectionParams.input, editor.object.currentQueryInput, 'Editor should be set to the mock editor');

		// If I call run on RunQueryAction when I am connected
		isConnected = true;
		queryAction.run();

		// showQueryResultsEditor and runQuery should be run, and the conneciton dialog should not open
		assert.equal(calledShowQueryResultsEditor, true, 'run should call showQueryResultsEditor');
		testQueryInput.verify(x => x.runQuery(), TypeMoq.Times.once());
		assert.equal(countCalledShowDialog, 1, 'run should not call showDialog');
		done();
	});

	test('CancelQueryAction calls cancelQuery() only if URI is connected', (done) => {
		// ... Create assert variables
		let isConnected: boolean = undefined;
		let calledCancelQuery: boolean = false;

		// ... Mock "isConnected" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {});
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);

		// ... Mock QueryModelService
		let queryModelService = TypeMoq.Mock.ofType(QueryModelService, TypeMoq.MockBehavior.Loose);
		queryModelService.setup(x => x.cancelQuery(TypeMoq.It.isAny())).callback(() => {
			calledCancelQuery = true;
		});

		// If I call run on CancelQueryAction when I am not connected
		let queryAction: CancelQueryAction = new CancelQueryAction(editor.object, queryModelService.object, connectionManagementService.object);
		isConnected = false;
		queryAction.run();

		// cancelQuery should not be run
		assert.equal(calledCancelQuery, false, 'run should not call cancelQuery');

		// If I call run on CancelQueryAction when I am connected
		isConnected = true;
		queryAction.run();

		// cancelQuery should be run
		assert.equal(calledCancelQuery, true, 'run should call cancelQuery');
		done();
	});

	// We want to call disconnectEditor regardless of connection to be able to cancel in-progress connections
	test('DisconnectDatabaseAction calls disconnectEditor regardless of URI being connected', (done) => {
		// ... Create assert variables
		let isConnected: boolean = undefined;
		let countCalledDisconnectEditor: number = 0;

		// ... Mock "isConnected" and "disconnectEditor" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {});
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);
		connectionManagementService.setup(x => x.disconnectEditor(TypeMoq.It.isAny())).callback(() => {
			countCalledDisconnectEditor++;
		});

		// If I call run on DisconnectDatabaseAction when I am not connected
		let queryAction: DisconnectDatabaseAction  = new DisconnectDatabaseAction(editor.object, connectionManagementService.object);
		isConnected = false;
		queryAction.run();

		// disconnectEditor should be run
		assert.equal(countCalledDisconnectEditor, 1, 'disconnectEditor should be called when URI is not connected');

		// If I call run on DisconnectDatabaseAction when I am connected
		isConnected = true;
		queryAction.run();

		// disconnectEditor should be run again
		assert.equal(countCalledDisconnectEditor, 2, 'disconnectEditor should be called when URI is connected');
		done();
	});

	test('ConnectDatabaseAction opens dialog regardless of URI connection state', (done) => {
		// ... Create assert variables
		let isConnected: boolean = undefined;
		let connectionParams: INewConnectionParams = undefined;
		let countCalledShowDialog: number = 0;

		// ... Mock "showDialog" ConnectionDialogService
		let connectionDialogService = TypeMoq.Mock.ofType(ConnectionDialogService, TypeMoq.MockBehavior.Loose);
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined))
		.callback((service: IConnectionManagementService, params: INewConnectionParams) => {
			connectionParams = params;
			countCalledShowDialog++;
		});

		// ... Mock "isConnected" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {}, connectionDialogService.object);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);

		// If I call run on ConnectDatabaseAction when I am not connected
		let queryAction: ConnectDatabaseAction = new ConnectDatabaseAction(editor.object, false, connectionManagementService.object);
		isConnected = false;
		queryAction.run();

		// The conneciton dialog should open with the correct parameter details
		assert.equal(countCalledShowDialog, 1, 'run should call showDialog');
		assert.equal(connectionParams.connectionType, ConnectionType.queryEditor, 'connectionType should be queryEditor');
		assert.equal(connectionParams.runQueryOnCompletion, false, 'runQueryOnCompletion should be false`');
		assert.equal(connectionParams.input.uri, testUri, 'URI should be set to the test URI');
		assert.equal(connectionParams.input, editor.object.currentQueryInput, 'Editor should be set to the mock editor');

		// If I call run on ConnectDatabaseAction when I am connected
		isConnected = true;
		queryAction.run();

		// The conneciton dialog should open again with the correct parameter details
		assert.equal(countCalledShowDialog, 2, 'run should call showDialog');
		assert.equal(connectionParams.connectionType, ConnectionType.queryEditor, 'connectionType should be queryEditor');
		assert.equal(connectionParams.runQueryOnCompletion, false, 'runQueryOnCompletion should be false`');
		assert.equal(connectionParams.input.uri, testUri, 'URI should be set to the test URI');
		assert.equal(connectionParams.input, editor.object.currentQueryInput, 'Editor should be set to the mock editor');
		done();
	});

	test('ChangeConnectionAction connects regardless of URI being connected', (done) => {
		// ... Create assert variables
		let queryAction: ConnectDatabaseAction = undefined;
		let isConnected: boolean = undefined;
		let connectionParams: INewConnectionParams = undefined;
		let calledShowDialog: number = 0;

		// ... Mock "showDialog" ConnectionDialogService
		let connectionDialogService = TypeMoq.Mock.ofType(ConnectionDialogService, TypeMoq.MockBehavior.Loose);
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined))
		.callback((service: IConnectionManagementService, params: INewConnectionParams) => {
			calledShowDialog++;
			connectionParams = params;
		});

		// ... Mock "isConnected" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {}, connectionDialogService.object);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);

		// If I call run on ChangeConnectionAction when I am not connected
		queryAction = new ConnectDatabaseAction(editor.object, false, connectionManagementService.object);
		isConnected = false;
		queryAction.run();

		// The conneciton dialog should open with the params set as below
		assert.equal(calledShowDialog, 1, 'showDialog should be called when URI is connected');
		assert.equal(connectionParams.connectionType, ConnectionType.queryEditor, 'connectionType should be queryEditor');
		assert.equal(connectionParams.runQueryOnCompletion, false, 'runQueryOnCompletion should be false`');
		assert.equal(connectionParams.input.uri, testUri, 'URI should be set to the test URI');
		assert.equal(connectionParams.input, editor.object.currentQueryInput, 'Editor should be set to the mock editor');
		// Then if I call run on ChangeConnectionAction when I am connected
		isConnected = true;
		queryAction.run();

		// The conneciton dialog should open with the params set as below
		assert.equal(calledShowDialog, 2, 'showDialog should be called when URI is connected');
		assert.equal(connectionParams.connectionType, ConnectionType.queryEditor, 'connectionType should be queryEditor');
		assert.equal(connectionParams.runQueryOnCompletion, false, 'runQueryOnCompletion should be false`');
		assert.equal(connectionParams.input.uri, testUri, 'URI should be set to the test URI');
		assert.equal(connectionParams.input, editor.object.currentQueryInput, 'Editor should be set to the mock editor');
		done();
	});

	test('ListDatabaseItem shows items as expected', (done) => {
		// ... Create assert variables
		let listItem: ListDatabasesActionItem = undefined;
		let isConnected: boolean = undefined;
		let databaseName: string = undefined;

		// ... Mock "isConnected" in ConnectionManagementService
		let connectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Loose, {}, {}, undefined);
		connectionManagementService.callBase = true;
		connectionManagementService.setup(x => x.isConnected(TypeMoq.It.isAnyString())).returns(() => isConnected);
		connectionManagementService.setup(x => x.getConnectionProfile(TypeMoq.It.isAny())).returns(() => <IConnectionProfile> {
			databaseName: databaseName
		});

		editor.setup(x => x.uri).returns(() => testUri);

		let selectBoxMock = TypeMoq.Mock.ofType(SelectBox, TypeMoq.MockBehavior.Loose, [], -1);

		// If I query without having initialized anything, state should be clear
		listItem = new ListDatabasesActionItem(editor.object, undefined, connectionManagementService.object, undefined);
		listItem._setSelectBox(selectBoxMock.object);

		assert.equal(listItem.isEnabled(), false, 'do not expect dropdown enabled unless connected');
		assert.equal(listItem.currentDatabaseName, undefined, 'do not expect dropdown to have entries unless connected');

		// When I connect, database name should be returned in the dropdown and this should be enabled
		isConnected = true;
		databaseName = 'master';
		listItem.onConnected();
		assert.equal(listItem.isEnabled(), true, 'expect dropdown enabled when connected');
		assert.equal(listItem.currentDatabaseName, 'master', 'expect dropdown to have current DB name when connected');

		// When I disconnect, state should return to default
		isConnected = false;
		databaseName = undefined;
		listItem.onDisconnect();
		assert.equal(listItem.isEnabled(), false, 'do not expect dropdown enabled unless connected');
		assert.equal(listItem.currentDatabaseName, undefined, 'do not expect dropdown to have entries unless connected');

		done();
	});
});