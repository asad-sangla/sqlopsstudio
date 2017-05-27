/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TestConnectionManagementService } from 'sqltest/stubs/connectionManagementService.test';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { QueryEditorService } from 'sql/parts/query/services/queryEditorService';
import { TestQuickOpenService } from 'vs/workbench/test/browser/quickopen.test';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import * as Utils from 'sql/parts/connection/common/utils';
import URI from 'vs/base/common/uri';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';


suite('SQL Actions Tests', () => {
	let editorService: TypeMoq.Mock<QueryEditorService>;
	let quickOpen: TypeMoq.Mock<TestQuickOpenService>;
	let conManService: TypeMoq.Mock<TestConnectionManagementService>;
	let connection: ConnectionProfile;
	let conProfGroup: ConnectionProfileGroup;

	setup(() => {
		// Setting up test connection profiles
		connection = new ConnectionProfile(undefined, {
			savePassword: false,
			groupFullName: 'testGroup',
			serverName: 'testServerName',
			databaseName: 'testDatabaseName',
			authenticationType: 'inetgrated',
			password: 'test',
			userName: 'testUsername',
			groupId: undefined,
			getOptionsKey: undefined,
			providerName: 'MSSQL',
			options: {},
			saveProfile: true,
			id: undefined
		});
		connection.id = 'testID';
		conProfGroup = new ConnectionProfileGroup('testGroup', undefined, 'testGroup', undefined, undefined);
		conProfGroup.connections = [connection];

		// Setting up our test table name
		let testTable = 'testTable';

		// Mocking the editor service
		editorService = TypeMoq.Mock.ofType(QueryEditorService, TypeMoq.MockBehavior.Strict);
		editorService.setup(x => x.newEditDataEditor(undefined, TypeMoq.It.isAnyString())).returns((schema, table) => {
			// assert that our input matches our test table name
			assert.equal(table, testTable);
			let docUri: URI = URI.parse('testURI');
			return new Promise(() => docUri);
		});

		// Mocking our quick open service
		quickOpen = TypeMoq.Mock.ofType(TestQuickOpenService, TypeMoq.MockBehavior.Strict);
		quickOpen.setup(x => x.pick(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((x) => {
			return TPromise.as(connection.id);
		});

		quickOpen.setup(x => x.input(TypeMoq.It.isAny())).returns((x) => {
			return TPromise.as(testTable);
		});

		conManService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Strict);
		conManService.setup(x => x.getConnectionGroups()).returns(() => [conProfGroup]);

	});

	test('Edit Data Action (With Connection)', (done) => {
		// Setting up our object
		let editDataAction = new EditDataAction(EditDataAction.ID, EditDataAction.LABEL, quickOpen.object, conManService.object, editorService.object, undefined);
		// Running test function
		return editDataAction.run(connection).then(() => {
			// Verifications
			quickOpen.verify(x => x.pick(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.never());
			quickOpen.verify(x => x.input(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());

			editorService.verify(x => x.newEditDataEditor(undefined, TypeMoq.It.isAnyString()), TypeMoq.Times.once());
		}).then(() => done(), (err) => done(err));
	});

	test('Edit Data Action (No Connection)', (done) => {
		// Setting up our object
		let editDataAction = new EditDataAction(EditDataAction.ID, EditDataAction.LABEL, quickOpen.object, conManService.object, editorService.object, undefined);
		// Running test function
		return editDataAction.run().then(() => {
			// Verifications
			conManService.verify(x => x.getConnectionGroups(), TypeMoq.Times.once());
			quickOpen.verify(x => x.pick(TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			quickOpen.verify(x => x.input(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());

			editorService.verify(x => x.newEditDataEditor(undefined, TypeMoq.It.isAnyString()), TypeMoq.Times.exactly(2));
		}).then(() => done(), (err) => done(err));
	});
});