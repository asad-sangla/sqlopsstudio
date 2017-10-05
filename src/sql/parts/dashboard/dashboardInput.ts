/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput, EditorModel } from 'vs/workbench/common/editor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

export class DashboardInput extends EditorInput {

	private _uri: string;
	public static ID: string = 'workbench.editorinputs.connectiondashboardinputs';
	public static SCHEMA: string = 'sqldashboard';

	private _initializedPromise: Thenable<void>;

	public get initializedPromise(): Thenable<void> {
		return this._initializedPromise;
	}

	private _uniqueSelector: string;

	public hasBootstrapped = false;
	// Holds the HTML content for the editor when the editor discards this input and loads another
	private _parentContainer: HTMLElement;

	constructor(
		private _connection: ConnectionManagementInfo,
		@IConnectionManagementService private _connectionService: IConnectionManagementService
	) {
		super();
		this._initializedPromise = _connectionService.connectIfNotConnected(_connection.connectionProfile, 'dashboard').then(u => this._uri = u).then();
	}

	public setUniqueSelector(uniqueSelector: string): void {
		this._uniqueSelector = uniqueSelector;
	}

	public getTypeId(): string {
		return UntitledEditorInput.ID;
	}

	public getName(): string {
		return this._connection.connectionProfile.serverName + ':' + this._connection.connectionProfile.databaseName;
	}

	public get uri(): string {
		return this._uri;
	}

	public dispose(): void {
		this._disposeContainer();
		this._connectionService.disconnect(this._uri);
		super.dispose();
	}

	private _disposeContainer() {
		if (!this._parentContainer) {
			return;
		}

		let parentNode = this._parentContainer.parentNode;
		if (parentNode) {
			parentNode.removeChild(this._parentContainer);
			this._parentContainer = null;
		}
	}

	set container(container: HTMLElement) {
		this._disposeContainer();
		this._parentContainer = container;
	}

	get container(): HTMLElement {
		return this._parentContainer;
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
		return !!this._uniqueSelector;
	}

	public get uniqueSelector(): string {
		return this._uniqueSelector;
	}

	public getConnectionInfo(): ConnectionManagementInfo {
		return this._connection;
	}
}
