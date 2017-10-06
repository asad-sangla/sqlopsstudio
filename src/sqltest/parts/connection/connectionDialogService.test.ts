/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { ConnectionDialogService } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import { ConnectionDialogWidget } from 'sql/parts/connection/connectionDialog/connectionDialogWidget';
import { ConnectionManagementService } from 'sql/parts/connection/common/connectionManagementService';
import { ConnectionType, IConnectableInput, IConnectionResult, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';

import * as TypeMoq from 'typemoq';

suite('ConnectionDialogService tests', () => {

	let connectionDialogService: ConnectionDialogService;
	let mockConnectionManagementService: TypeMoq.Mock<ConnectionManagementService>;
	let mockConnectionDialog: TypeMoq.Mock<ConnectionDialogWidget>;

	setup(() => {
		connectionDialogService = new ConnectionDialogService(undefined, undefined, undefined, undefined, undefined);
		mockConnectionManagementService = TypeMoq.Mock.ofType(ConnectionManagementService, TypeMoq.MockBehavior.Strict, {}, {});
		(connectionDialogService as any)._connectionManagementService = mockConnectionManagementService.object;
		mockConnectionDialog = TypeMoq.Mock.ofType(ConnectionDialogWidget);
		(connectionDialogService as any)._connectionDialog = mockConnectionDialog.object;
	});

	function testHandleDefaultOnConnectUri(isEditor: boolean) {
		let testUri = 'test_uri';
		let connectionParams = <INewConnectionParams>{
			connectionType: isEditor ? ConnectionType.editor : ConnectionType.default,
			input: <IConnectableInput>{
				uri: testUri,
				onConnectStart: undefined,
				onConnectSuccess: undefined,
				onConnectReject: undefined,
				onDisconnect: undefined
			},
			runQueryOnCompletion: undefined,
			querySelection: undefined
		};
		mockConnectionManagementService.setup(x => x.connectAndSaveProfile(undefined, TypeMoq.It.is(_ => true), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(
			() => Promise.resolve(<IConnectionResult>{ connected: true, errorMessage: undefined, errorCode: undefined }));

		// If I call handleDefaultOnConnect with the given parameters
		(connectionDialogService as any).handleDefaultOnConnect(connectionParams, undefined);

		// Then the Connection Management Service's connect method was called with the expected URI
		let expectedUri = isEditor ? testUri : undefined;
		mockConnectionManagementService.verify(
			x => x.connectAndSaveProfile(undefined, TypeMoq.It.is(uri => uri === expectedUri), TypeMoq.It.isAny(), TypeMoq.It.isAny()),
			TypeMoq.Times.once());
	}

	test('handleDefaultOnConnect uses params URI for editor connections', () => {
		testHandleDefaultOnConnectUri(true);
	});

	test('handleDefaultOnConnect uses undefined URI for non-editor connections', () => {
		testHandleDefaultOnConnectUri(false);
	});
});