/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import data = require('data');
import * as TypeMoq from 'typemoq';
import { ConnectionDialogService } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { ConnectionManagementService } from 'sql/parts/connection/common/ConnectionManagementService';
import { ConnectionStore } from 'sql/parts/connection/common/connectionStore';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { WorkbenchEditorService } from 'vs/workbench/services/editor/browser/editorService';
import { TPromise } from 'vs/base/common/winjs.base';
import { INewConnectionParams, ConnectionType, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';

suite('SQL ConnectionManagementService tests', () => {

	let connectionDialogService: TypeMoq.Mock<ConnectionDialogService>;
	let connectionStore: TypeMoq.Mock<ConnectionStore>;
	let instantiationService: TypeMoq.Mock<InstantiationService>;
	let workbenchEditorService: TypeMoq.Mock<WorkbenchEditorService>;

	let connectionProfile: IConnectionProfile = {
		serverName: 'new server',
		databaseName: 'database',
		userName: 'user',
		password: 'password',
		authenticationType: 'integrated',
		savePassword: true,
		groupFullName: 'g2/g2-2',
		groupId: 'group id',
		getUniqueId: undefined,
		providerName: 'MSSQL',
		options: {},
		saveProfile: true
	};

	let connectionManagementService: ConnectionManagementService;
	setup(() => {
		connectionDialogService = TypeMoq.Mock.ofType(ConnectionDialogService);
		connectionStore = TypeMoq.Mock.ofType(ConnectionStore);
		instantiationService = TypeMoq.Mock.ofType(InstantiationService);
		workbenchEditorService = TypeMoq.Mock.ofType(WorkbenchEditorService);

		let none: void;

		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as(none));
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined)).returns(() => TPromise.as(none));
		connectionStore.setup(x => x.addSavedPassword(TypeMoq.It.isAny())).returns(() => Promise.resolve(connectionProfile));
		connectionStore.setup(x => x.addActiveConnection(TypeMoq.It.isAny())).returns(() => Promise.resolve());
		connectionStore.setup(x => x.saveProfile(TypeMoq.It.isAny())).returns(() => Promise.resolve(connectionProfile));
		workbenchEditorService.setup(x => x.openEditor(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as(undefined));

		connectionManagementService = new ConnectionManagementService(
			undefined,
			connectionStore.object,
			connectionDialogService.object,
			instantiationService.object,
			workbenchEditorService.object,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined);
	});

	function verifyShowDialog(connectionProfile: IConnectionProfile, connectionType: ConnectionType, uri: string): void {
		if (connectionProfile) {
			connectionDialogService.verify(x => x.showDialog(
				TypeMoq.It.isAny(),
				TypeMoq.It.is<INewConnectionParams>(p => p.connectionType === connectionType && ((uri === undefined && p.input === undefined) || p.input.uri === uri)),
				TypeMoq.It.is<IConnectionProfile>(c => c.serverName === connectionProfile.serverName)), TypeMoq.Times.once());

		} else {
			connectionDialogService.verify(x => x.showDialog(
				TypeMoq.It.isAny(),
				TypeMoq.It.is<INewConnectionParams>(p => p.connectionType === connectionType && ((uri === undefined && p.input === undefined) || p.input.uri === uri)),
				undefined), TypeMoq.Times.once());
		}
	}

	function verifyOptions(options?: IConnectionCompletionOptions, fromDialog?: boolean): void {
		if (options) {
			if (options.saveToSettings) {
				connectionStore.verify(x => x.saveProfile(TypeMoq.It.isAny()), TypeMoq.Times.once());
			}
			if (options.showDashboard) {
				workbenchEditorService.verify(x => x.openEditor(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			}
		}

		if (fromDialog !== undefined && fromDialog) {
			connectionStore.verify(x => x.addSavedPassword(TypeMoq.It.isAny()), TypeMoq.Times.once());
		}
	}

	function connect(uri: string, options?: IConnectionCompletionOptions, fromDialog?: boolean): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			connectionManagementService.onConnectionRequestSent(() => {
				let info: data.ConnectionInfoSummary = {
					connectionId: 'id',
					connectionSummary: {
						databaseName: connectionProfile.databaseName,
						serverName: connectionProfile.serverName,
						userName: connectionProfile.userName
					},
					errorMessage: undefined,
					errorNumber: undefined,
					messages: undefined,
					ownerUri: uri,
					serverInfo: undefined
				};
				connectionManagementService.onConnectionComplete(0, info);
			});
			connectionManagementService.cancelConnectionForUri(uri).then(() => {
				if (fromDialog) {
					resolve(connectionManagementService.connectAndSaveProfile(connectionProfile, uri, options));
				} else {
					resolve(connectionManagementService.connect(connectionProfile, uri, options));
				}
			});
		});
	}

	test('showConnectionDialog should open the dialog with default type given no parameters', done => {
		connectionManagementService.showConnectionDialog().then(() => {
			verifyShowDialog(undefined, ConnectionType.default, undefined);
			done();
		}).catch(err => {
			assert.fail(err);
		});
	});

	test('showConnectionDialog should open the dialog with given type given valid input', done => {
		let params: INewConnectionParams = {
			connectionType: ConnectionType.editor,
			input: {
				onConnectReject: undefined,
				onConnectStart: undefined,
				onDisconnect: undefined,
				onConnectSuccess: undefined,
				uri: 'Editor Uri'
			},
			runQueryOnCompletion: true
		};
		connectionManagementService.showConnectionDialog(params).then(() => {
			verifyShowDialog(undefined, params.connectionType, params.input.uri);
			done();
		}).catch(err => {
			assert.fail(err);
		});
	});

	test('showConnectionDialog should pass the model to the dialog if there is a model assigned to the uri', done => {
		let params: INewConnectionParams = {
			connectionType: ConnectionType.editor,
			input: {
				onConnectReject: undefined,
				onConnectStart: undefined,
				onDisconnect: undefined,
				onConnectSuccess: undefined,
				uri: 'Editor Uri'
			},
			runQueryOnCompletion: true
		};

		connect(params.input.uri).then(() => {
			let saveConnection = connectionManagementService.getConnectionProfile(params.input.uri);

			assert.notEqual(saveConnection, undefined, `profile was not added to the connections`);
			assert.equal(saveConnection.serverName, connectionProfile.serverName, `Server names are different`);
			connectionManagementService.showConnectionDialog(params).then(() => {
				verifyShowDialog(connectionProfile, params.connectionType, params.input.uri);
				done();
			}).catch(err => {
				assert.fail(err);
				done();
			});
		});
	});

	test('connect should save profile given options with saveProfile set to true', done => {
		let uri: string = 'Editor Uri';
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveToSettings: true,
			showDashboard: false
		};

		connect(uri, options).then(() => {
			verifyOptions(options);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('connect should show dashboard given options with showDashboard set to true', done => {
		let uri: string = 'Editor Uri';
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveToSettings: true,
			showDashboard: false
		};

		connect(uri, options).then(() => {
			verifyOptions(options);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('connectAndSaveProfile should show not load the password', done => {
		let uri: string = 'Editor Uri';
		let options: IConnectionCompletionOptions = undefined;

		connect(uri, options, true).then(() => {
			verifyOptions(options);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});
});