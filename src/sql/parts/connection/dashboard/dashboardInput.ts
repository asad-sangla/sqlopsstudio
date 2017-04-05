/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput, EditorModel } from 'vs/workbench/common/editor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';

export class DashboardInput extends EditorInput {

	public static ID: string = 'workbench.editorinputs.connectiondashboardinputs';
	public static SCHEMA: string = 'sqldashboard';

	private _hasInitialized: boolean = false;

	constructor(private _uri: string, private _connection: ConnectionManagementInfo) {
		super();
	}

	public setHasInitialized(): void {
		this._hasInitialized = true;
	}

	public getTypeId(): string {
		return UntitledEditorInput.ID;
	}

	public getName(): string {
		return this._connection.connectionProfile.serverName + ':' + this._connection.connectionProfile.databaseName;
	}

	public getUri(): string {
		return this._uri;
	}

	public supportsSplitEditor(): boolean {
		return false;
	}

	public getConnectionProfile(): IConnectionProfile {
		return this._connection.connectionProfile;
	}

	public resolve(refresh?: boolean): TPromise<EditorModel> {
		return undefined;
	}

	public get hasInitialized(): boolean {
		return this._hasInitialized;
    }

	public getConnectionInfo(): ConnectionManagementInfo {
		return this._connection;
	}
}
