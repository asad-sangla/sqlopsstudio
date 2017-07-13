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
import { MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { DialogSelectBox } from 'sql/parts/common/modal/dialogSelectBox';
import { DialogInputBox } from 'sql/parts/common/modal/dialogInputBox';
import { DialogHelper } from 'sql/parts/common/modal/dialogHelper';
import { IConnectionComponentCallbacks } from 'sql/parts/connection/connectionDialog/connectionDialogService';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ConnectionOptionSpecialType } from 'sql/parts/connection/common/connectionManagement';
import * as Constants from 'sql/parts/connection/common/constants';
import { ConnectionProfileGroup, IConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as styler from 'vs/platform/theme/common/styler';
import * as DOM from 'vs/base/browser/dom';
import data = require('data');

export class ConnectionWidget {
	private _builder: Builder;
	private _serverGroupSelectBox: DialogSelectBox;
	private _serverGroupOptions: IConnectionProfileGroup[];
	private _serverNameInputBox: DialogInputBox;
	private _databaseNameInputBox: DialogInputBox;
	private _userNameInputBox: DialogInputBox;
	private _passwordInputBox: DialogInputBox;
	private _rememberPasswordCheckBox: Checkbox;
	private _advancedButton: Button;
	private _callbacks: IConnectionComponentCallbacks;
	private _authTypeSelectBox: DialogSelectBox;
	private _toDispose: lifecycle.IDisposable[];
	private _optionsMaps: { [optionType: number]: data.ConnectionOption };
	private _tableContainer: Builder;
	private _providerName: string;
	private _authTypeMap: { [providerName: string]: AuthenticationType[] } = {
		[Constants.mssqlProviderName]: [new AuthenticationType('Integrated', false), new AuthenticationType('SqlLogin', true)],
		[Constants.pgsqlProviderName]: []
	};
	private _saveProfile: boolean;
	public DefaultServerGroup: IConnectionProfileGroup = {
		id: '',
		name: '<Default>',
		parentId: undefined,
		color: undefined,
		description: undefined,
	};

	private _addNewServerGroup = {
		id: '',
		name: 'Add New Group...',
		parentId: undefined,
		color: undefined,
		description: undefined,
	};
	public NoneServerGroup: IConnectionProfileGroup = {
		id: '',
		name: '<None>',
		parentId: undefined,
		color: undefined,
		description: undefined,
	};
	constructor(options: data.ConnectionOption[],
		callbacks: IConnectionComponentCallbacks,
		providerName: string,
		@IThemeService private _themeService: IThemeService) {
		this._callbacks = callbacks;
		this._toDispose = [];
		this._optionsMaps = {};
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			this._optionsMaps[option.specialValueType] = option;
		}

		var authTypeOption = this._optionsMaps[ConnectionOptionSpecialType.authType];
		this._authTypeSelectBox = authTypeOption ? new DialogSelectBox(authTypeOption.categoryValues.map(c => c.displayName), authTypeOption.defaultValue) : undefined;
		this._providerName = providerName;
	}

	public createConnectionWidget(container: HTMLElement): void {
		this._serverGroupOptions = [this.DefaultServerGroup];
		this._serverGroupSelectBox = new DialogSelectBox(this._serverGroupOptions.map(g => g.name), this.DefaultServerGroup.name);
		this._builder = $().div({ class: 'connection-table' }, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				this._tableContainer = tableContainer;
			});
		});
		this.fillInConnectionForm();
		this.registerListeners();
		if (this._authTypeSelectBox) {
			this.onAuthTypeSelected(this._authTypeSelectBox.value);
		}
		DOM.append(container, this._builder.getHTMLElement());
	}

	private fillInConnectionForm(): void {
		this._serverNameInputBox = DialogHelper.appendInputBox(
			DialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.serverName].displayName, 'connection-label', 'connection-input'));
		if (this._optionsMaps[ConnectionOptionSpecialType.authType]) {
			DialogHelper.appendInputSelectBox(
				DialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.authType].displayName, 'connection-label', 'connection-input'), this._authTypeSelectBox);
		}
		this._userNameInputBox = DialogHelper.appendInputBox(
			DialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.userName].displayName, 'connection-label', 'connection-input'));
		this._passwordInputBox = DialogHelper.appendInputBox(
			DialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.password].displayName, 'connection-label', 'connection-input'));
		this._passwordInputBox.inputElement.type = 'password';
		this._rememberPasswordCheckBox = this.appendCheckbox(this._tableContainer, 'Remember Password', 'sql-checkbox', 'connection-input', false);
		this._databaseNameInputBox = DialogHelper.appendInputBox(
			DialogHelper.appendRow(this._tableContainer, this._optionsMaps[ConnectionOptionSpecialType.databaseName].displayName, 'connection-label', 'connection-input'));
		this._databaseNameInputBox.setPlaceHolder(this._optionsMaps[ConnectionOptionSpecialType.databaseName].defaultValue || '');
		DialogHelper.appendInputSelectBox(
			DialogHelper.appendRow(this._tableContainer, 'Server Group', 'connection-label', 'connection-input'), this._serverGroupSelectBox);
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
					button.addListener('click', () => {
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
				checkbox = DialogHelper.createCheckBox(inputCellContainer, label, checkboxClass, isChecked, onCheck);
			});
		});
		return checkbox;
	}

	private registerListeners(): void {
		// Theme styler
		this._toDispose.push(styler.attachInputBoxStyler(this._serverNameInputBox, this._themeService));
		this._toDispose.push(styler.attachInputBoxStyler(this._databaseNameInputBox, this._themeService));
		this._toDispose.push(styler.attachInputBoxStyler(this._userNameInputBox, this._themeService));
		this._toDispose.push(styler.attachInputBoxStyler(this._passwordInputBox, this._themeService));
		this._toDispose.push(styler.attachSelectBoxStyler(this._serverGroupSelectBox, this._themeService));
		this._toDispose.push(styler.attachButtonStyler(this._advancedButton, this._themeService));
		this._toDispose.push(styler.attachCheckboxStyler(this._rememberPasswordCheckBox, this._themeService));

		if (this._authTypeSelectBox) {
			// Theme styler
			this._toDispose.push(styler.attachSelectBoxStyler(this._authTypeSelectBox, this._themeService));
			this._toDispose.push(this._authTypeSelectBox.onDidSelect(selectedAuthType => {
				this.onAuthTypeSelected(selectedAuthType);
			}));
		}

		this._toDispose.push(this._serverGroupSelectBox.onDidSelect(selectedGroup => {
			this.onGroupSelected(selectedGroup);
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

	private onGroupSelected(selectedGroup: string) {
		if (selectedGroup === this._addNewServerGroup.name) {
			this._callbacks.onCreateNewServerGroup();
		}
	}

	private onAuthTypeSelected(selectedAuthType: string) {
		let currentAuthType = this.getMatchingAuthType(selectedAuthType);
		if (!currentAuthType.showUsernameAndPassword) {
			this._userNameInputBox.disable();
			this._passwordInputBox.disable();
			this._userNameInputBox.hideMessage();
			this._passwordInputBox.hideMessage();
			this._userNameInputBox.value = '';
			this._passwordInputBox.value = '';
		} else {
			this._userNameInputBox.enable();
			this._passwordInputBox.enable();
		}
	}

	private serverNameChanged(serverName: string) {
		this._callbacks.onSetConnectButton(!DialogHelper.isEmptyString(serverName));
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

	public focusOnServerGroup() {
		this._serverGroupSelectBox.focus();
	}

	public updateServerGroup(connectionGroups: IConnectionProfileGroup[], groupName?: string) {
		this._serverGroupOptions = connectionGroups;
		this._serverGroupOptions.push(this._addNewServerGroup);
		this._serverGroupSelectBox.setOptions(this._serverGroupOptions.map(g => g.name));
		if (groupName) {
			this._serverGroupSelectBox.selectWithOptionName(groupName);
		}
	}

	public initDialog(connectionInfo: IConnectionProfile): void {
		this.fillInConnectionInputs(connectionInfo);
	}

	public focusOnOpen(): void {
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
			this._saveProfile = connectionInfo.saveProfile;
			let groupName: string;
			if (this._saveProfile) {
				if (!connectionInfo.groupFullName) {
					groupName = this.DefaultServerGroup.name;
				} else {
					groupName = connectionInfo.groupFullName.replace('root/', '');
				}
			} else {
				groupName = this.NoneServerGroup.name;
			}
			this._serverGroupSelectBox.selectWithOptionName(groupName);
			this._rememberPasswordCheckBox.checked = connectionInfo.savePassword;

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
		return this._authTypeSelectBox ? this.getAuthTypeName(this._authTypeSelectBox.value) : undefined;
	}

	private validateInputs(): boolean {
		let validInputs = true;
		let option: data.ConnectionOption;
		let currentAuthType = this._authTypeSelectBox ? this.getMatchingAuthType(this._authTypeSelectBox.value) : undefined;
		if (!currentAuthType || currentAuthType.showUsernameAndPassword) {
			option = this._optionsMaps[ConnectionOptionSpecialType.userName];
			if (DialogHelper.isEmptyString(this.userName) && option.isRequired) {
				validInputs = false;
				this._userNameInputBox.showMessage({ type: MessageType.ERROR, content: 'User name is required.' });
			}
			option = this._optionsMaps[ConnectionOptionSpecialType.password];
			if (DialogHelper.isEmptyString(this.password) && option.isRequired) {
				validInputs = false;
				this._passwordInputBox.showMessage({ type: MessageType.ERROR, content: 'Password is required.' });
			}
		}
		option = this._optionsMaps[ConnectionOptionSpecialType.databaseName];
		if (DialogHelper.isEmptyString(this.databaseName) && option.isRequired) {
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
			if (this._serverGroupSelectBox.value === this.DefaultServerGroup.name) {
				model.groupFullName = '';
				model.saveProfile = true;
				model.groupId = this.findGroupId(model.groupFullName);
			} else if (this._serverGroupSelectBox.value === this.NoneServerGroup.name) {
				model.groupFullName = '';
				model.saveProfile = false;
			} else if (this._serverGroupSelectBox.value !== this._addNewServerGroup.name) {
				model.groupFullName = this._serverGroupSelectBox.value;
				model.saveProfile = true;
				model.groupId = this.findGroupId(model.groupFullName);
			}
		}
		return validInputs;
	}

	private findGroupId(groupFullName: string): string {
		let group: IConnectionProfileGroup;
		if (ConnectionProfileGroup.isRoot(groupFullName)) {
			group = this._serverGroupOptions.find(g => ConnectionProfileGroup.isRoot(g.name));
			if (group === undefined) {
				group = this._serverGroupOptions.find(g => g.name === this.DefaultServerGroup.name);
			}
		} else {
			group = this._serverGroupOptions.find(g => g.name === groupFullName);
		}
		return group ? group.id : undefined;
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}

	private getMatchingAuthType(displayName: string): AuthenticationType {
		return this._authTypeMap[this._providerName].find(authType => this.getAuthTypeDisplayName(authType.name) === displayName);
	}
}

class AuthenticationType {
	public name: string;
	public showUsernameAndPassword: boolean;

	constructor(name: string, showUsernameAndPassword: boolean) {
		this.name = name;
		this.showUsernameAndPassword = showUsernameAndPassword;
	}
}