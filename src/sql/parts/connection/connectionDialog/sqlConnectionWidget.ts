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
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ConnectionOptionSpecialType } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');

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
	private _windowsAuthTypeName: string;
	private _sqlAuthTypeName: string;
	private _authenticationOptions: string[];
	private _authTypeSelectBox: ConnectionDialogSelectBox;
	private _toDispose: lifecycle.IDisposable[];
	private _optionsMaps: { [optionType: number]: data.ConnectionOption };
	private _tableContainer: Builder;

	constructor(options: data.ConnectionOption[], callbacks: IConnectionComponentCallbacks) {
		this._callbacks = callbacks;
		this._toDispose = [];
		this._optionsMaps = {};
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			this._optionsMaps[option.specialValueType] = option;
		}

		var authTypeOption = this._optionsMaps[ConnectionOptionSpecialType.authType];
		this._sqlAuthTypeName = authTypeOption.categoryValues[0].name;
		this._windowsAuthTypeName = authTypeOption.categoryValues[1].name;
		this._authTypeSelectBox = new ConnectionDialogSelectBox(authTypeOption.categoryValues.map(c => c.name), authTypeOption.defaultValue);
	}

	public createSqlConnectionWidget(): HTMLElement {
		this._builder = $().div({ class: 'connection-table' }, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				this._tableContainer = tableContainer;
			});
		});
		this.fillInSqlConnectionForm();
		this.registerListeners();
		this.onAuthTypeSelected(this._authTypeSelectBox.value);
		return this._builder.getHTMLElement();
	}

	private fillInSqlConnectionForm(): void {
		this._serverNameInputBox = ConnectionDialogHelper.appendInputBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.serverName].displayName, 'connection-label', 'connection-input'));
		ConnectionDialogHelper.appendInputSelectBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.authType].displayName, 'connection-label', 'connection-input'), this._authTypeSelectBox);
		this._userNameInputBox = ConnectionDialogHelper.appendInputBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.userName].displayName, 'connection-label', 'connection-input'));
		this._passwordInputBox = ConnectionDialogHelper.appendInputBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.password].displayName, 'connection-label', 'connection-input'));
		this._passwordInputBox.inputElement.type = 'password';
		this._rememberPassword = this.appendCheckbox(this._tableContainer, 'Remember Password', 'connection-checkbox', 'connection-input');
		this._databaseNameInputBox = ConnectionDialogHelper.appendInputBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.databaseName].displayName, 'connection-label', 'connection-input'));
		this._serverGroupInputBox = ConnectionDialogHelper.appendInputBox(
			ConnectionDialogHelper.appendRow(this._tableContainer, 'Add to Server group', 'connection-label', 'connection-input'));
		this._advancedButton = this.createAdvancedButton(this._tableContainer, 'Advanced...');
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
			case this._windowsAuthTypeName:
				this._userNameInputBox.disable();
				this._passwordInputBox.disable();
				this._userNameInputBox.hideMessage();
				this._passwordInputBox.hideMessage();
				this._userNameInputBox.value = '';
				this._passwordInputBox.value = '';
				break;
			case this._sqlAuthTypeName:
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
		return value ? value : '';
	}

	public fillInConnectionInputs(connectionInfo: IConnectionProfile) {
		if (connectionInfo) {
			this._serverNameInputBox.value = this.getModelValue(connectionInfo.serverName);
			this._databaseNameInputBox.value = this.getModelValue(connectionInfo.databaseName);
			this._userNameInputBox.value = this.getModelValue(connectionInfo.userName);
			this._passwordInputBox.value = this.getModelValue(connectionInfo.password);
			this._serverGroupInputBox.value = this.getModelValue(connectionInfo.groupName);
			this._rememberPassword.checked = !ConnectionDialogHelper.isEmptyString(connectionInfo.password);
			if (connectionInfo.authenticationType !== null && connectionInfo.authenticationType !== undefined) {
				switch (connectionInfo.authenticationType) {
					case 'SqlLogin':
						this._authTypeSelectBox.selectWithOptionName(this._sqlAuthTypeName);
						break;
					default:
						this._authTypeSelectBox.selectWithOptionName(this._windowsAuthTypeName);
						break;
				}
				this.onAuthTypeSelected(this._authTypeSelectBox.value);
			}
		}
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
			case this._sqlAuthTypeName:
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
		let validInputs = true;
		let option: data.ConnectionOption;
		if (this._authTypeSelectBox.value === this._sqlAuthTypeName) {
			option = this._optionsMaps[ConnectionOptionSpecialType.userName];
			if (ConnectionDialogHelper.isEmptyString(this.userName) && option.isRequired) {
				validInputs = false;
				this._userNameInputBox.showMessage({ type: MessageType.ERROR, content: 'User name is required.' });
			}
			option = this._optionsMaps[ConnectionOptionSpecialType.password];
			if (ConnectionDialogHelper.isEmptyString(this.password) && option.isRequired) {
				validInputs = false;
				this._passwordInputBox.showMessage({ type: MessageType.ERROR, content: 'Password is required.' });
			}
		}
		option = this._optionsMaps[ConnectionOptionSpecialType.databaseName];
		if (ConnectionDialogHelper.isEmptyString(this.databaseName) && option.isRequired) {
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