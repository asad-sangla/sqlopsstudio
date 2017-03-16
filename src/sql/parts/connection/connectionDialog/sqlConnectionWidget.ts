/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/bootstrap';
import 'vs/css!./media/bootstrap-theme';
import 'vs/css!./media/sqlConnection';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import { IConnectionComponentCallbacks } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import * as lifecycle from 'vs/base/common/lifecycle';
import * as platform from 'vs/base/common/platform';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';

export class SqlConnectionWidget {
	private _builder: Builder;
	private _serverGroupInputBox: InputBox;
	private _serverNameInputBox: InputBox;
	private _databaseNameInputBox: InputBox;
	private _userNameInputBox: InputBox;
	private _passwordInputBox: InputBox;
	private _rememberPassword: Checkbox;
	private _advancedButton: Button;
	private _callbacks: IConnectionComponentCallbacks;
	private _WindowsAuthTypeName: string = 'Windows Authentication';
	private _SqlAuthTypeName: string = 'SQL Server Authentication';
	private _authenticationOptions: string[];
	private _authTypeSelectBox: ConnectionDialogSelectBox;
	private _toDispose: lifecycle.IDisposable[];

	constructor(callbacks: IConnectionComponentCallbacks)
	{
		this._callbacks = callbacks;
		this._toDispose = [];

		if (platform.isWindows) {
			this._authenticationOptions = [this._WindowsAuthTypeName, this._SqlAuthTypeName];
			this._authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this._WindowsAuthTypeName);
		} else {
			this._authenticationOptions = [this._SqlAuthTypeName];
			this._authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this._SqlAuthTypeName);
		}
	}

	public createSqlConnectionWidget(): HTMLElement {
		this._builder = $().div({class:'connection-table'}, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				this._serverNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Server Name', 'connection-label', 'connection-input'));
				ConnectionDialogHelper.appendInputSelectBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Authentication', 'connection-label', 'connection-input'), this._authTypeSelectBox);
				this._userNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'User Name', 'connection-label', 'connection-input'));
				this._passwordInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Password', 'connection-label', 'connection-input'));
				this._passwordInputBox.inputElement.type = 'password';
				this._rememberPassword = this.appendCheckbox(tableContainer, 'Remember Password', 'connection-checkbox', 'connection-input');
				this._databaseNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Database Name', 'connection-label', 'connection-input'));
				this._serverGroupInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Add to Server group', 'connection-label', 'connection-input'));
				this._advancedButton = this.createAdvancedButton(tableContainer, 'Advanced...');

			});
		});
		this.registerListeners();
		this.onAuthTypeSelected(this._authTypeSelectBox.value);
		return this._builder.getHTMLElement();
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
						this._callbacks.onAdvancedProperties();
					});
				});
			});
		});
		return button;
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

	private registerListeners(): void {
		this._toDispose.push(this._authTypeSelectBox.onDidSelect(selectedAuthType => {
			this.onAuthTypeSelected(selectedAuthType);
		}));

		this._toDispose.push(this._serverNameInputBox.onDidChange(serverName => {
			this.serverNameChanged(serverName);
		}));

		this._toDispose.push(this._userNameInputBox.onDidChange(userName => {
			this.userNameChanged(userName);
		}));

		this._toDispose.push(this._passwordInputBox.onDidChange(password => {
			this.passwordChanged(password);
		}));

		this._toDispose.push(this._databaseNameInputBox.onDidChange(database => {
			this.databaseNameChanged(database);
		}));
	}

	private onAuthTypeSelected(selectedAuthType: string) {
		switch (selectedAuthType) {
			case this._WindowsAuthTypeName:
				this._userNameInputBox.disable();
				this._passwordInputBox.disable();
				this._userNameInputBox.hideMessage();
				this._passwordInputBox.hideMessage();
				this._userNameInputBox.value = '';
				this._passwordInputBox.value = '';
				break;
			case this._SqlAuthTypeName:
				this._userNameInputBox.enable();
				this._passwordInputBox.enable();
			default:
				break;
		}
	}

	private serverNameChanged(serverName: string) {
		this._callbacks.onSetConnectButton(!ConnectionDialogHelper.isEmptyString(serverName));
	}

	private userNameChanged(userName: string) {
		this._userNameInputBox.hideMessage();
	}

	private passwordChanged(password: string) {
		this._passwordInputBox.hideMessage();
	}

	private databaseNameChanged(database: string) {
		this._databaseNameInputBox.hideMessage();
	}

	public focusOnAdvancedButton() {
		this._advancedButton.focus();
	}

	public initDialog(connectionInfo: IConnectionProfile): void {
		this.fillInConnectionInputs(connectionInfo);
		this._serverNameInputBox.focus();
	}

	private getModelValue(value: string): string {
		return !!value ? value : ''
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile) {
		this._serverNameInputBox.value = this.getModelValue(connectionInfo.serverName);
		this._databaseNameInputBox.value = this.getModelValue(connectionInfo.databaseName);
		this._userNameInputBox.value = this.getModelValue(connectionInfo.userName);
		this._passwordInputBox.value = this.getModelValue(connectionInfo.password);
		this._serverGroupInputBox.value = this.getModelValue(connectionInfo.groupName);
		this._rememberPassword.checked = !ConnectionDialogHelper.isEmptyString(connectionInfo.password);

		switch (connectionInfo.authenticationType) {
			case 'SqlLogin':
				this._authTypeSelectBox.selectWithOptionName(this._SqlAuthTypeName);
				break;
			default:
				this._authTypeSelectBox.selectWithOptionName(this._WindowsAuthTypeName);
				break;
		}
		this.onAuthTypeSelected(this._authTypeSelectBox.value);
	}

	public get serverGroup(): string {
		return this._serverGroupInputBox.value;
	}

	public get serverName(): string {
		return this._serverNameInputBox.value;
	}

	public get databaseName(): string {
		return this._databaseNameInputBox.value;
	}

	public get userName(): string {
		return this._userNameInputBox.value;
	}

	public get password(): string {
		return this._passwordInputBox.value;
	}

	public get authenticationType(): string {
		switch (this._authTypeSelectBox.value) {
			case this._SqlAuthTypeName:
				return 'SqlLogin';
			default:
				return 'Integrated';
		}
	}

	public set authenticationType(authenticationType: string) {
		let index = this._authenticationOptions.indexOf(authenticationType);
		if (index >= 0) {
			this._authTypeSelectBox.select(index);
		}
	}

	private validateInputs(): boolean {
		var validInputs = true;
		if (this._authTypeSelectBox.value === this._SqlAuthTypeName) {
			if (ConnectionDialogHelper.isEmptyString(this.userName)) {
				validInputs = false;
				this._userNameInputBox.showMessage({ type: MessageType.ERROR, content: 'User name is required.' });
			}
			if (ConnectionDialogHelper.isEmptyString(this.password)) {
				validInputs = false;
				this._passwordInputBox.showMessage({ type: MessageType.ERROR, content: 'Password is required.' });
			}
		}
		if (ConnectionDialogHelper.isEmptyString(this.databaseName)) {
			validInputs = false;
			this._databaseNameInputBox.showMessage({ type: MessageType.ERROR, content: 'Database name is required.' });
		}
		return validInputs;
	}

	public connect(model: IConnectionProfile): boolean {
		var validInputs = this.validateInputs();
		if (validInputs) {
			model.serverName = this.serverName;
			model.databaseName = this.databaseName;
			model.userName = this.userName;
			model.password = this.password;
			model.authenticationType = this.authenticationType;
			model.savePassword = this._rememberPassword.checked;
			model.groupName = this.serverGroup;
			model.groupId = undefined;
		}
		return validInputs;
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}