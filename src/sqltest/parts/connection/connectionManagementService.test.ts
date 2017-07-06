/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionDialogTestService } from 'sqltest/stubs/connectionDialogTestService';
import { ConnectionManagementService } from 'sql/parts/connection/common/connectionManagementService';
import { ConnectionStatusManager } from 'sql/parts/connection/common/connectionStatusManager';
import { ConnectionStore } from 'sql/parts/connection/common/connectionStore';
import { INewConnectionParams, ConnectionType, IConnectionCompletionOptions, IConnectionResult } from 'sql/parts/connection/common/connectionManagement';
import * as Constants from 'sql/parts/connection/common/constants';

import { WorkbenchEditorTestService } from 'sqltest/stubs/workbenchEditorTestService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { EditorGroupTestService } from 'sqltest/stubs/editorGroupService';
import { CapabilitiesTestService } from 'sqltest/stubs/capabilitiesTestService';
import { ConnectionProviderStub } from 'sqltest/stubs/connectionProviderStub';

import data = require('data');

import { TPromise } from 'vs/base/common/winjs.base';
import { WorkspaceConfigurationTestService } from 'sqltest/stubs/workspaceConfigurationTestService';

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';

suite('SQL ConnectionManagementService tests', () => {

	let capabilitiesService: CapabilitiesTestService;
	let connectionDialogService: TypeMoq.Mock<ConnectionDialogTestService>;
	let connectionStore: TypeMoq.Mock<ConnectionStore>;
	let workbenchEditorService: TypeMoq.Mock<WorkbenchEditorTestService>;
	let editorGroupService: TypeMoq.Mock<EditorGroupTestService>;
	let connectionStatusManager: ConnectionStatusManager;
	let mssqlConnectionProvider: TypeMoq.Mock<ConnectionProviderStub>;
	let pgConnectionProvider: TypeMoq.Mock<ConnectionProviderStub>;
	let workspaceConfigurationServiceMock: TypeMoq.Mock<WorkspaceConfigurationTestService>;

	let none: void;

	let connectionProfile: IConnectionProfile = {
		serverName: 'new server',
		databaseName: 'database',
		userName: 'user',
		password: 'password',
		authenticationType: 'integrated',
		savePassword: true,
		groupFullName: 'g2/g2-2',
		groupId: 'group id',
		getOptionsKey: () => { return 'connectionId'; },
		providerName: 'MSSQL',
		options: {},
		saveProfile: true,
		id: undefined
	};
	let connectionProfileWithoutPassword: IConnectionProfile =
		Object.assign({}, connectionProfile, { password: '', serverName: connectionProfile.serverName + 1 });

	let connectionManagementService: ConnectionManagementService;
	let configResult: { [key: string]: any } = {};

	setup(() => {

		capabilitiesService = new CapabilitiesTestService();
		connectionDialogService = TypeMoq.Mock.ofType(ConnectionDialogTestService);
		connectionStore = TypeMoq.Mock.ofType(ConnectionStore);
		workbenchEditorService = TypeMoq.Mock.ofType(WorkbenchEditorTestService);
		editorGroupService = TypeMoq.Mock.ofType(EditorGroupTestService);
		connectionStatusManager = new ConnectionStatusManager(capabilitiesService);
		mssqlConnectionProvider = TypeMoq.Mock.ofType(ConnectionProviderStub);
		pgConnectionProvider = TypeMoq.Mock.ofType(ConnectionProviderStub);

		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined)).returns(() => TPromise.as(none));
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined, undefined)).returns(() => TPromise.as(none));
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as(none));
		connectionDialogService.setup(x => x.showDialog(TypeMoq.It.isAny(), TypeMoq.It.isAny(), undefined, TypeMoq.It.isAny())).returns(() => TPromise.as(none));

		connectionStore.setup(x => x.addActiveConnection(TypeMoq.It.isAny())).returns(() => Promise.resolve());
		connectionStore.setup(x => x.saveProfile(TypeMoq.It.isAny())).returns(() => Promise.resolve(connectionProfile));
		workbenchEditorService.setup(x => x.openEditor(undefined, TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => TPromise.as(undefined));
		editorGroupService.setup(x => x.getStacksModel()).returns(() => undefined);
		connectionStore.setup(x => x.addSavedPassword(TypeMoq.It.is<IConnectionProfile>(
			c => c.serverName === connectionProfile.serverName))).returns(() => Promise.resolve(connectionProfile));
		connectionStore.setup(x => x.addSavedPassword(TypeMoq.It.is<IConnectionProfile>(
			c => c.serverName === connectionProfileWithoutPassword.serverName))).returns(() => Promise.resolve(connectionProfileWithoutPassword));
		connectionStore.setup(x => x.isPasswordRequired(TypeMoq.It.isAny())).returns(() => true);

		mssqlConnectionProvider.setup(x => x.connect(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => undefined);
		pgConnectionProvider.setup(x => x.connect(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => undefined);

		// setup configuration to return a config that can be modified later.

		workspaceConfigurationServiceMock = TypeMoq.Mock.ofType(WorkspaceConfigurationTestService);
		workspaceConfigurationServiceMock.setup(x => x.getConfiguration(Constants.sqlConfigSectionName))
			.returns(() => configResult);

		connectionManagementService = new ConnectionManagementService(
			undefined,
			connectionStore.object,
			undefined,
			connectionDialogService.object,
			undefined,
			undefined,
			undefined,
			workbenchEditorService.object,
			undefined,
			undefined,
			undefined,
			undefined,
			workspaceConfigurationServiceMock.object,
			undefined,
			capabilitiesService,
			undefined,
			editorGroupService.object,
			undefined);

		connectionManagementService.registerProvider('MSSQL', mssqlConnectionProvider.object);
		connectionManagementService.registerProvider('PGSQL', pgConnectionProvider.object);
	});

	function verifyShowDialog(connectionProfile: IConnectionProfile, connectionType: ConnectionType, uri: string, error?: string): void {

		if (connectionProfile) {
			connectionDialogService.verify(x => x.showDialog(
				TypeMoq.It.isAny(),
				TypeMoq.It.is<INewConnectionParams>(p => p.connectionType === connectionType && (uri === undefined || p.input.uri === uri)),
				TypeMoq.It.is<IConnectionProfile>(c => c.serverName === connectionProfile.serverName), error), TypeMoq.Times.once());

		} else {
			connectionDialogService.verify(x => x.showDialog(
				TypeMoq.It.isAny(),
				TypeMoq.It.is<INewConnectionParams>(p => p.connectionType === connectionType && ((uri === undefined && p.input === undefined) || p.input.uri === uri)),
				undefined, error), TypeMoq.Times.once());
		}

	}

	function verifyOptions(options?: IConnectionCompletionOptions, fromDialog?: boolean): void {

		if (options) {
			if (options.saveTheConnection) {
				connectionStore.verify(x => x.saveProfile(TypeMoq.It.isAny()), TypeMoq.Times.once());
			}
			if (options.showDashboard) {
				workbenchEditorService.verify(x => x.openEditor(undefined, TypeMoq.It.isAny(), TypeMoq.It.isAny()), TypeMoq.Times.once());
			}
		}

		if (fromDialog !== undefined && !fromDialog) {
			connectionStore.verify(x => x.addSavedPassword(TypeMoq.It.isAny()), TypeMoq.Times.once());
		}

	}

	function connect(uri: string, options?: IConnectionCompletionOptions, fromDialog?: boolean, connection?: IConnectionProfile, error?: string): Promise<IConnectionResult> {
		let connectionToUse = connection ? connection : connectionProfile;
		return new Promise<IConnectionResult>((resolve, reject) => {
			let id = connectionToUse.getOptionsKey();
			let defaultUri = 'connection://' + (id ? id : connection.serverName + ':' + connection.databaseName);
			connectionManagementService.onConnectionRequestSent(() => {
				let info: data.ConnectionInfoSummary = {
					connectionId: error ? undefined : 'id',
					connectionSummary: {
						databaseName: connectionToUse.databaseName,
						serverName: connectionToUse.serverName,
						userName: connectionToUse.userName
					},
					errorMessage: error,
					errorNumber: undefined,
					messages: error,
					ownerUri: uri ? uri : defaultUri,
					serverInfo: undefined
				};
				connectionManagementService.onConnectionComplete(0, info);
			});
			connectionManagementService.cancelConnectionForUri(uri).then(() => {
				if (fromDialog) {
					resolve(connectionManagementService.connectAndSaveProfile(connectionToUse, uri, options));
				} else {
					resolve(connectionManagementService.connect(connectionToUse, uri, options));
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
			saveTheConnection: true,
			showDashboard: false,
			showConnectionDialogOnError: false
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
			saveTheConnection: false,
			showDashboard: true,
			showConnectionDialogOnError: false
		};

		connect(uri, options).then(() => {
			verifyOptions(options);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('connect should pass the params in options to onConnectSuccess callback', done => {
		let uri: string = 'Editor Uri';
		let paramsInOnConnectSuccess: INewConnectionParams;
		let options: IConnectionCompletionOptions = {
			params: {
				connectionType: ConnectionType.editor,
				input: {
					onConnectSuccess: (params?: INewConnectionParams) => {
						paramsInOnConnectSuccess = params;
					},
					onConnectReject: undefined,
					onConnectStart: undefined,
					onDisconnect: undefined,
					uri: uri
				},
				querySelection: undefined,
				runQueryOnCompletion: false
			},
			saveTheConnection: true,
			showDashboard: false,
			showConnectionDialogOnError: true
		};

		connect(uri, options).then(() => {
			verifyOptions(options);
			assert.notEqual(paramsInOnConnectSuccess, undefined);
			assert.equal(paramsInOnConnectSuccess.connectionType, options.params.connectionType);
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
			verifyOptions(options, true);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('connect with undefined uri and options should connect using the default uri', done => {
		let uri = undefined;
		let options: IConnectionCompletionOptions = undefined;

		connect(uri, options).then(() => {
			assert.equal(connectionManagementService.isProfileConnected(connectionProfile), true);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('failed connection should open the dialog if connection fails', done => {
		let uri = undefined;
		let error: string = 'error';
		let expectedConnection: boolean = false;
		let expectedError: string = error;
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showDashboard: false,
			showConnectionDialogOnError: true
		};

		connect(uri, options, false, connectionProfile, error).then(result => {
			assert.equal(result.connected, expectedConnection);
			assert.equal(result.error, expectedError);
			verifyShowDialog(connectionProfile, ConnectionType.default, uri, error);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('failed connection should not open the dialog if the option is set to false even if connection fails', done => {
		let uri = undefined;
		let error: string = 'error when options set to false';
		let expectedConnection: boolean = false;
		let expectedError: string = error;
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showDashboard: false,
			showConnectionDialogOnError: false
		};

		connect(uri, options, false, connectionProfile, error).then(result => {
			assert.equal(result.connected, expectedConnection);
			assert.equal(result.error, expectedError);
			// TODO: not sure how to verify not called
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});


	test('connect when password is empty and required should open the dialog', done => {
		let uri = undefined;
		let expectedConnection: boolean = false;
		let expectedError: string = undefined;
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showDashboard: false,
			showConnectionDialogOnError: true
		};

		connect(uri, options, false, connectionProfileWithoutPassword).then(result => {
			assert.equal(result.connected, expectedConnection);
			assert.equal(result.error, expectedError);
			verifyShowDialog(connectionProfileWithoutPassword, ConnectionType.default, uri, expectedError);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('connect from editor when empty password when it is required should open the dialog', done => {
		let uri = 'editor 3';
		let expectedConnection: boolean = false;
		let expectedError: string = undefined;
		let options: IConnectionCompletionOptions = {
			params: {
				connectionType: ConnectionType.editor,
				input: {
					onConnectSuccess: undefined,
					onConnectReject: undefined,
					onConnectStart: undefined,
					onDisconnect: undefined,
					uri: uri
				},
				querySelection: undefined,
				runQueryOnCompletion: false
			},
			saveTheConnection: true,
			showDashboard: false,
			showConnectionDialogOnError: true
		};

		connect(uri, options, false, connectionProfileWithoutPassword).then(result => {
			assert.equal(result.connected, expectedConnection);
			assert.equal(result.error, expectedError);
			verifyShowDialog(connectionProfileWithoutPassword, ConnectionType.editor, uri, expectedError);
			done();
		}).catch(err => {
			assert.fail(err);
			done();
		});
	});

	test('doChangeLanguageFlavor should throw on unknown provider', done => {
		// given a provider that will never exist
		let invalidProvider = 'notaprovider';
		// when I call doChangeLanguageFlavor
		// Then I expect it to throw
		assert.throws(() => connectionManagementService.doChangeLanguageFlavor('file://my.sql', 'sql', invalidProvider));
		done();
	});

	test('doChangeLanguageFlavor should send event for known provider', done => {
		// given a provider that is registered
		let uri = 'file://my.sql';
		let language = 'sql';
		let flavor = 'MSSQL';
		// when I call doChangeLanguageFlavor
		try {
			let called = false;
			connectionManagementService.onLanguageFlavorChanged((changeParams: data.DidChangeLanguageFlavorParams) => {
				called = true;
				assert.equal(changeParams.uri, uri);
				assert.equal(changeParams.language, language);
				assert.equal(changeParams.flavor, flavor);
			});
			connectionManagementService.doChangeLanguageFlavor(uri, language, flavor);
			assert.ok(called, 'expected onLanguageFlavorChanged event to be sent');
		} catch (error) {
			assert.fail(error);
		}
		done();
	});

	test('ensureDefaultLanguageFlavor should not send event if uri is connected', done => {
		let uri: string = 'Editor Uri';
		let options: IConnectionCompletionOptions = {
			params: undefined,
			saveTheConnection: false,
			showDashboard: true,
			showConnectionDialogOnError: false
		};

		let called = false;
		connectionManagementService.onLanguageFlavorChanged((changeParams: data.DidChangeLanguageFlavorParams) => {
			called = true;
		});
		connect(uri, options).then(() => {
			connectionManagementService.ensureDefaultLanguageFlavor(uri);
			assert.equal(called, false, 'do not expect flavor change to be called');
		}).catch(err => {
			assert.fail(err);
		});
		done();
	});

	test('ensureDefaultLanguageFlavor should change to default provider if not connected ', done => {
		// Given pgsql is the default provider
		let pgsqlProvider = 'PGSQL';
		configResult[Constants.defaultEngine] = pgsqlProvider;
		let uri: string = 'Editor Uri';
		let language = 'sql';
		let called = false;
		connectionManagementService.onLanguageFlavorChanged((changeParams: data.DidChangeLanguageFlavorParams) => {
			called = true;
			assert.equal(changeParams.uri, uri);
			assert.equal(changeParams.language, language);
			assert.equal(changeParams.flavor, pgsqlProvider);
		});

		try {
			connectionManagementService.ensureDefaultLanguageFlavor(uri);
			assert.ok(called, 'expected onLanguageFlavorChanged event to be sent');
		} catch(err) {
			assert.fail(err);
		}
		done();
	});

});