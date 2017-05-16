/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/sqlConnection';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import { IConnectionComponentCallbacks } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionOptionSpecialType } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');

export class SqlConnectionWidget {
	private _builder: Builder;
	private _serverGroupInputBox: InputBox;
	private _serverNameInputBox: InputBox;
	private _databaseNameInputBox: InputBox;
	private _userNameInputBox: InputBox;
	private _passwordInputBox: InputBox;
	private _rememberPasswordCheckBox: Checkbox;
	private _advancedButton: Button;
	private _callbacks: IConnectionComponentCallbacks;
	private _integratedAuthTypeName: string = 'Integrated';
	private _sqlAuthTypeName: string = 'SqlLogin';
	private _authTypeSelectBox: ConnectionDialogSelectBox;
	private _toDispose: lifecycle.IDisposable[];
	private _optionsMaps: { [optionType: number]: data.ConnectionOption };
	private _tableContainer: Builder;
	private _saveProfile: boolean;

	constructor(options: data.ConnectionOption[], callbacks: IConnectionComponentCallbacks) {
		this._callbacks = callbacks;
		this._toDispose = [];
		this._optionsMaps = {};
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			this._optionsMaps[option.specialValueType] = option;
		}

		var authTypeOption = this._optionsMaps[ConnectionOptionSpecialType.authType];
		this._authTypeSelectBox = new ConnectionDialogSelectBox(authTypeOption.categoryValues.map(c => c.displayName), authTypeOption.defaultValue);
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
		this._rememberPasswordCheckBox = this.appendCheckbox(this._tableContainer, 'Remember Password', 'connection-checkbox', 'connection-input', false);
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

	private appendCheckbox(container: Builder, label: string, checkboxClass: string, cellContainerClass: string, isChecked: boolean, onCheck?: (viaKeyboard: boolean) => void): Checkbox {
		let checkbox: Checkbox;
		container.element('tr', {}, (rowContainer) => {
			rowContainer.element('td');
			rowContainer.element('td', { class: cellContainerClass }, (inputCellContainer) => {
				checkbox = new Checkbox({
					actionClassName: checkboxClass,
					title: label,
					isChecked: isChecked,
					onChange: (viaKeyboard) => {
						if (onCheck) {
							onCheck(viaKeyboard);
						}
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

	private onSaveConnectionChecked(viaKeyboard: boolean) {
		if (this._saveProfile) {
			this._serverGroupInputBox.enable();
		} else {
			this._serverGroupInputBox.disable();
		}
	}

	private onAuthTypeSelected(selectedAuthType: string) {
		var integratedAuthTypeDisplayName = this.getAuthTypeDisplayName(this._integratedAuthTypeName);
		var sqlAuthTypeDisplayName = this.getAuthTypeDisplayName(this._sqlAuthTypeName);

		switch (selectedAuthType) {
			case integratedAuthTypeDisplayName:
				this._userNameInputBox.disable();
				this._passwordInputBox.disable();
				this._userNameInputBox.hideMessage();
				this._passwordInputBox.hideMessage();
				this._userNameInputBox.value = '';
				this._passwordInputBox.value = '';
				break;
			case sqlAuthTypeDisplayName:
				this._userNameInputBox.enable();
				this._passwordInputBox.enable();
			default:
				break;
		}
	}

	private serverNameChanged(serverName: string) {
		this._callbacks.onSetConnectButton(!ConnectionDialogHelper.isEmptyString(serverName));
		if (this.isSubsetString(serverName.toLocaleLowerCase(), 'database.windows.net')) {
			this._callbacks.onSetAzureTimeOut();
		}
	}

	private isSubsetString(str: string, subStr: string) {
		return str.indexOf(subStr) !== -1;
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
			this._serverGroupInputBox.value = this.getModelValue(connectionInfo.groupFullName);
			this._rememberPasswordCheckBox.checked = connectionInfo.savePassword;
			this._saveProfile = connectionInfo.saveProfile;
			this.onSaveConnectionChecked(this._saveProfile);
			if (connectionInfo.authenticationType !== null && connectionInfo.authenticationType !== undefined) {
				var authTypeDisplayName = this.getAuthTypeDisplayName(connectionInfo.authenticationType);
				this._authTypeSelectBox.selectWithOptionName(authTypeDisplayName);
				this.onAuthTypeSelected(this._authTypeSelectBox.value);
			}
		}
	}

	private getAuthTypeDisplayName(authTypeName: string) {
		var displayName: string;
		var authTypeOption = this._optionsMaps[ConnectionOptionSpecialType.authType];
		authTypeOption.categoryValues.forEach(c => {
			if (c.name === authTypeName) {
				displayName = c.displayName;
			}
		});
		return displayName;
	}

	private getAuthTypeName(authTypeDisplayName: string) {
		var authTypeName: string;
		var authTypeOption = this._optionsMaps[ConnectionOptionSpecialType.authType];
		authTypeOption.categoryValues.forEach(c => {
			if (c.displayName === authTypeDisplayName) {
				authTypeName = c.name;
			}
		});
		return authTypeName;
	}

	public handleOnConnecting(): void {
		this._advancedButton.enabled = false;
	}

	public handleResetConnection(): void {
		this._advancedButton.enabled = true;
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
		return this.getAuthTypeName(this._authTypeSelectBox.value);
	}

	private validateInputs(): boolean {
		let validInputs = true;
		let option: data.ConnectionOption;
		var sqlAuthTypeDisplayName = this.getAuthTypeDisplayName(this._sqlAuthTypeName);
		if (this._authTypeSelectBox.value === sqlAuthTypeDisplayName) {
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
			model.savePassword = this._rememberPasswordCheckBox.checked;
			model.groupFullName = this.serverGroup;
			model.groupId = undefined;
		}
		return validInputs;
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}