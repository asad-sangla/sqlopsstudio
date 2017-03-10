/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/bootstrap';
import 'vs/css!./media/bootstrap-theme';
import 'vs/css!./media/connectionDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import * as lifecycle from 'vs/base/common/lifecycle';
import * as platform from 'vs/base/common/platform';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import vscode = require('vscode');
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { TreeUtils } from 'sql/parts/connection/electron-browser/recentConnectionsController';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
	onAdvancedProperties: () => void;
}

export class ConnectionDialogWidget {
	private _builder: Builder;
	private container: HTMLElement;
	private modelElement: HTMLElement;
	private serverGroupInputBox: InputBox;
	private serverNameInputBox: InputBox;
	private databaseNameInputBox: InputBox;
	private userNameInputBox: InputBox;
	private passwordInputBox: InputBox;
	private rememberPassword: Checkbox;
	private callbacks: IConnectionDialogCallbacks;
	private model: IConnectionProfile;
	private toDispose: lifecycle.IDisposable[];
	private authTypeSelectBox: ConnectionDialogSelectBox;
	private advancedButton: Button;
	private connectButton: Button;
	private closeButton: Button;
	private WindowsAuthTypeName: string = 'Windows Authentication';
	private SqlAuthTypeName: string = 'SQL Server Authentication';
	private _dialog: ModalDialogBuilder;
	private _authenticationOptions: string[];
	private _recentConnectionButtons: Button[];

	constructor(container: HTMLElement,
		callbacks: IConnectionDialogCallbacks,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService)
	{
		this.container = container;
		this.setCallbacks(callbacks);
		this.toDispose = [];
		this._recentConnectionButtons = [];
		if (platform.isWindows) {
			this._authenticationOptions = [this.WindowsAuthTypeName, this.SqlAuthTypeName];
			this.authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this.WindowsAuthTypeName);
		} else {
			this._authenticationOptions = [this.SqlAuthTypeName];
			this.authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this.SqlAuthTypeName);
		}
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('connectionDialogModal', 'Connect to Server', 'connection-dialog-widget', 'connectionDialogBody');
		this._builder = this._dialog.create();
		this._dialog.addModalTitle();
		this._dialog.bodyContainer.div({class:'connection-recent', id: 'recentConnection'});
		this._dialog.addErrorMessage();
		this._dialog.bodyContainer.div({class:'connection-table'}, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				this.serverNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Server Name', 'connection-label', 'connection-input'));
				ConnectionDialogHelper.appendInputSelectBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Authentication', 'connection-label', 'connection-input'), this.authTypeSelectBox);
				this.userNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'User Name', 'connection-label', 'connection-input'));
				this.passwordInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Password', 'connection-label', 'connection-input'));
				this.passwordInputBox.inputElement.type = 'password';
				this.rememberPassword = this.appendCheckbox(tableContainer, 'Remember Password', 'connection-checkbox', 'connection-input');
				this.databaseNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Database Name', 'connection-label', 'connection-input'));
				this.serverGroupInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Add to Server group', 'connection-label', 'connection-input'));
				this.advancedButton = this.createAdvancedButton(tableContainer, 'Advanced...');

			});
		});


		this.connectButton = this.createFooterButton(this._dialog.footerContainer, 'Connect');
		this.connectButton.enabled = false;
		this.closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this._builder.build(this.container);
		this.registerListeners();
		this.modelElement = this._builder.getHTMLElement();
		this.onAuthTypeSelected(this.authTypeSelectBox.value);

		return this.modelElement;
	}

	private appendCheckbox(container: Builder, label: string, checkboxClass: string, cellContainerClass: string): Checkbox {
		let checkbox: Checkbox;
		container.element('tr', {}, (rowContainer) => {
			rowContainer.element('td');
			rowContainer.element('td', { class: cellContainerClass }, (inputCellContainer) => {
				checkbox = new Checkbox({
					actionClassName: checkboxClass,
					title: label,
					isChecked: false,
					onChange: (viaKeyboard) => {
						//todo when the remember password checkbox is changed
					}
				});
				inputCellContainer.getHTMLElement().appendChild(checkbox.domNode);
				inputCellContainer.div({}, (labelContainer) => {
					labelContainer.innerHtml(label);
				});
			});
		});
		return checkbox;
	}

	private createAdvancedButton(container: Builder, title: string): Button {
		let button;
		container.element('tr', {}, (rowContainer) => {
			rowContainer.element('td');
			rowContainer.element('td', { align: 'right' }, (cellContainer) => {
				cellContainer.div({ class: 'advanced-button' }, (divContainer) => {
					button = new Button(divContainer);
					button.label = title;
					button.addListener2('click', () => {
						//open advanced page
						this.callbacks.onAdvancedProperties();
					});
				});
			});
		});
		return button;
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', (cellContainer) => {
			cellContainer.div({class:'footer-button'}, (buttonContainer) => {
				button = new Button(buttonContainer);
				button.label = title;
				button.addListener2('click', () => {
					if (title === 'Connect') {
						this.connect();
					} else {
						this.cancel();
					}
				});
			});

		});

		return button;
	}

	private registerListeners(): void {
		this.toDispose.push(this.authTypeSelectBox.onDidSelect(selectedAuthType => {
			this.onAuthTypeSelected(selectedAuthType);
		}));

		this.toDispose.push(this.serverNameInputBox.onDidChange(serverName => {
			this.serverNameChanged(serverName);
		}));

		this.toDispose.push(this.userNameInputBox.onDidChange(userName => {
			this.userNameChanged(userName);
		}));

		this.toDispose.push(this.passwordInputBox.onDidChange(password => {
			this.passwordChanged(password);
		}));

		this.toDispose.push(this.databaseNameInputBox.onDidChange(database => {
			this.databaseNameChanged(database);
		}));
	}

	private databaseNameChanged(database: string) {
		this.databaseNameInputBox.hideMessage();
	}

	private passwordChanged(password: string) {
		this.passwordInputBox.hideMessage();
	}

	private userNameChanged(userName: string) {
		this.userNameInputBox.hideMessage();
	}

	private serverNameChanged(serverName: string) {
		this.connectButton.enabled = !this.isEmptyString(serverName);
	}

	private onAuthTypeSelected(selectedAuthType: string) {
		switch (selectedAuthType) {
			case this.WindowsAuthTypeName:
				this.userNameInputBox.disable();
				this.passwordInputBox.disable();
				this.userNameInputBox.hideMessage();
				this.passwordInputBox.hideMessage();
				this.userNameInputBox.value = '';
				this.passwordInputBox.value = '';
				break;
			case this.SqlAuthTypeName:
				this.userNameInputBox.enable();
				this.passwordInputBox.enable();
			default:
				break;
		}
	}

	public getConnection(): IConnectionProfile {
		return this.model;
	}

	public setConnection(model: IConnectionProfile) {
		this.serverNameInputBox.value = model.serverName;
		this.databaseNameInputBox.value = model.databaseName;
		this.userNameInputBox.value = model.userName;
		this.passwordInputBox.value = model.password;
		this.serverGroupInputBox.value = model.groupName;
		this.authenticationType = model.authenticationType;
		this.initDialog();
	}

	public get serverGroup(): string {
		return this.serverGroupInputBox.value;
	}

	public get serverName(): string {
		return this.serverNameInputBox.value;
	}

	public get databaseName(): string {
		return this.databaseNameInputBox.value;
	}

	public get userName(): string {
		return this.userNameInputBox.value;
	}

	public get password(): string {
		return this.passwordInputBox.value;
	}

	public get authenticationType(): string {
		switch (this.authTypeSelectBox.value) {
			case this.SqlAuthTypeName:
				return 'SqlLogin';
			default:
				return 'Integrated';
		}
	}

	public set authenticationType(authenticationType: string) {
		let index = this._authenticationOptions.indexOf(authenticationType);
		if (index >= 0) {
			this.authTypeSelectBox.select(index);
		}
	}


	public setCallbacks(callbacks: IConnectionDialogCallbacks): void {
		this.callbacks = callbacks;
	}

	private validateInputs(): boolean {
		var validInputs = true;
		if (this.authTypeSelectBox.value === this.SqlAuthTypeName) {
			if (this.isEmptyString(this.userName)) {
				validInputs = false;
				this.userNameInputBox.showMessage({ type: MessageType.ERROR, content: 'User name is required.' });
			}
			if (this.isEmptyString(this.password)) {
				validInputs = false;
				this.passwordInputBox.showMessage({ type: MessageType.ERROR, content: 'Password is required.' });
			}
		}
		if (this.isEmptyString(this.databaseName)) {
			validInputs = false;
			this.databaseNameInputBox.showMessage({ type: MessageType.ERROR, content: 'Database name is required.' });
		}
		return validInputs;
	}

	private isEmptyString(value: string): boolean {
		//TODO find a better way to check for empty string
		return value === undefined || value === '';
	}

	public connect(): void {
		if (this.validateInputs()) {
			this.model = {
				serverName: this.serverName,
				databaseName: this.databaseName,
				userName: this.userName,
				password: this.password,
				authenticationType: this.authenticationType,
				savePassword: this.rememberPassword.checked,
				groupName: this.serverGroup,
				groupId: undefined
			};

			this.connectButton.enabled = false;
			this.callbacks.onConnect();
			this._dialog.showSpinner();

		} else {
			this.showError('Missing required fields');
		}
	}

	public cancel() {
		this.callbacks.onCancel();
		this.close();
	}

	public close() {
		this.clearRecentConnection();
		jQuery('#connectionDialogModal').modal('hide');
	}

	public focusOnAdvancedButton() {
		this.advancedButton.focus();
	}

	private createRecentConnectionsBuilder(recentConnections: vscode.ConnectionInfo[]): Builder {
		var recentConnectionBuilder = $().div({ class: 'connection-recent-content' }, (recentConnectionContainer) => {
			recentConnectionContainer.div({class:'modal-title'}, (recentTitle) => {
				recentTitle.innerHtml('Recent History');
			});

			recentConnectionContainer.element('div', { class: 'server-explorer-viewlet' }, (divContainer: Builder) => {
				divContainer.element('div', { class: 'explorer-servers'}, (treeContainer: Builder) => {
					let recentConnectionTree = TreeUtils.createConnectionTree(treeContainer.getHTMLElement(), this._instantiationService);
					TreeUtils.structuralTreeUpdate(recentConnectionTree, 'recent', this._connectionManagementService).then(() => {
						// call layout with view height
						recentConnectionTree.layout(300);
						divContainer.append(recentConnectionTree.getHTMLElement());
					});
				});
			});
		});
		return recentConnectionBuilder;
	}

	private OnRecentConnectionClick(connectionInfo: vscode.ConnectionInfo) {
		this.serverNameInputBox.value = connectionInfo.serverName;
		this.databaseNameInputBox.value = connectionInfo.databaseName;
		this.userNameInputBox.value = connectionInfo.userName;
		this.passwordInputBox.value = connectionInfo.password;
		this.rememberPassword.checked = !this.isEmptyString(connectionInfo.password);
		this.authTypeSelectBox.selectWithOptionName(connectionInfo.authenticationType);
		this.serverGroupInputBox.value = '';
	}

	private clearRecentConnection() {
		this._builder.off(DOM.EventType.KEY_DOWN);
		jQuery('#recentConnection').empty();
		while (this._recentConnectionButtons.length) {
			this._recentConnectionButtons.pop().dispose();
		}
	}

	public open(recentConnections: vscode.ConnectionInfo[]) {
		if(recentConnections.length !== 0) {
			var recentConnectionbuilder = this.createRecentConnectionsBuilder(recentConnections);
			jQuery('#recentConnection').append(recentConnectionbuilder.getHTMLElement());
		}

		jQuery('#connectionDialogModal').modal({ backdrop: false, keyboard: true });
		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				if (this.connectButton.enabled) {
					this.connect();
				}
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			}
		});
	}

	private initDialog(): void {
		this._dialog.showError('');
		this._dialog.hideSpinner();
		this.serverNameInputBox.focus();
	}

	public showError(err: string) {
		this._dialog.showError(err);
		this._dialog.hideSpinner();
		this.connectButton.enabled = true;
	}

	public dispose(): void {
		this.toDispose = lifecycle.dispose(this.toDispose);
	}
}