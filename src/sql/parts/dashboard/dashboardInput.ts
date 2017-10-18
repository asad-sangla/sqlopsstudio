/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TPromise } from 'vs/base/common/winjs.base';
import { EditorInput, EditorModel } from 'vs/workbench/common/editor';
import { UntitledEditorInput } from 'vs/workbench/common/editor/untitledEditorInput';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
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
		_connectionProfile: IConnectionProfile,
		@IConnectionManagementService private _connectionService: IConnectionManagementService
	) {
		super();
		this._initializedPromise = _connectionService.connectIfNotConnected(_connectionProfile, 'dashboard').then(u => this._uri = u).then();
	}

	public setUniqueSelector(uniqueSelector: string): void {
		this._uniqueSelector = uniqueSelector;
	}

	public getTypeId(): string {
		return UntitledEditorInput.ID;
	}

	public getName(): string {
		let name = this.connectionProfile.serverName;
		if (this.connectionProfile.databaseName
			&& !this.isMasterMssql())
		{
			// Only add DB name if this is a non-default, non-master connection
			name = name + ':' + this.connectionProfile.databaseName;
		}
		return name;
	}

	private isMasterMssql(): boolean {
		return this.connectionProfile.providerName.toLowerCase() === 'mssql'
			&& this.connectionProfile.databaseName.toLowerCase() === 'master';
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

	public get connectionProfile(): IConnectionProfile {
		return this._connectionService.getConnectionProfile(this._uri);
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

	public matches(otherinput: any): boolean {
		if (otherinput instanceof DashboardInput) {
			if (this.connectionProfile
				&& otherinput.connectionProfile
				&& this.connectionProfile.getOptionsKey() === otherinput.connectionProfile.getOptionsKey()) {
				return true;
			}
		}
		return false;
	}
}
