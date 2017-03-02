/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./bootstrap';
import 'vs/css!./bootstrap-theme';
import 'vs/css!./connectionDialog';
import { Builder } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/checkbox/checkbox';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import * as lifecycle from 'vs/base/common/lifecycle';
import * as platform from 'vs/base/common/platform';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';

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

	constructor(container: HTMLElement, callbacks: IConnectionDialogCallbacks) {
		this.container = container;
		this.setCallbacks(callbacks);
		this.toDispose = [];
		if (platform.isWindows) {
			this._authenticationOptions = [this.WindowsAuthTypeName, this.SqlAuthTypeName];
			this.authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this.WindowsAuthTypeName);
		} else {
			this._authenticationOptions = [this.SqlAuthTypeName];
			this.authTypeSelectBox = new ConnectionDialogSelectBox(this._authenticationOptions, this.SqlAuthTypeName);
		}
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('connectionDialogModal', 'Connection Dialog', 'connection-dialog-widget', 'connectionDialogBody');
		this._builder = this._dialog.create();
		this._dialog.bodyContainer.div({class:'connection-recent'}, (recentContainer) => {
			recentContainer.div({class:'modal-title'}, (recentTitle) => {
				recentTitle.innerHtml('Recent History');
			});
		});
		this._dialog.bodyContainer.div({class:'connection-table'}, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				this.serverGroupInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Add to Server group', 'connection-label', 'connection-input'));
				this.serverNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Server Name', 'connection-label', 'connection-input'));
				ConnectionDialogHelper.appendInputSelectBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Authentication', 'connection-label', 'connection-input'), this.authTypeSelectBox);
				this.userNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'User Name', 'connection-label', 'connection-input'));
				this.passwordInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Password', 'connection-label', 'connection-input'));
				this.passwordInputBox.inputElement.type = 'password';
				this.rememberPassword = this.appendCheckbox(tableContainer, 'Remember Password', 'checkbox', 'connection-input');
				this.databaseNameInputBox = ConnectionDialogHelper.appendInputBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Database Name', 'connection-label', 'connection-input'));
				this.advancedButton = this.createAdvancedButton(tableContainer, 'Advanced...');
			});
		});

		this.connectButton = this.createFooterButton(this._dialog.footerContainer, 'Connect');
		this.connectButton.enabled = false;
		this.closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this._builder.build(this.container);
		this.registerListeners();
		this.modelElement = this._builder.getHTMLElement();
		this.serverNameInputBox.focus();

		this.onAuthTypeSelected(this.authTypeSelectBox.value);

		return this.modelElement;
	}

	private appendCheckbox(container: Builder, label: string, checkboxClass: string, cellContainerClass: string): Checkbox {
		let checkbox: Checkbox;
		container.element('tr', {}, (rowContainer) => {
			rowContainer.element('td');
			rowContainer.element('td', { class: 'connection-' + cellContainerClass }, (inputCellContainer) => {
				checkbox = new Checkbox({
					actionClassName: 'connection-' + checkboxClass,
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
		container.element('td', { class: 'footer-button' }, (cellContainer) => {
			button = new Button(cellContainer);
			button.label = title;
			button.addListener2('click', () => {
				if (title === 'Connect') {
					this.connect();
				} else {
					this.cancel();
				}
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
	}

	private serverNameChanged(serverName: string) {
		this.connectButton.enabled = !this.isEmptyString(serverName);
	}

	private onAuthTypeSelected(selectedAuthType: string) {
		switch (selectedAuthType) {
			case this.WindowsAuthTypeName:
				this.userNameInputBox.disable();
				this.passwordInputBox.disable();
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
		this.showError('');
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
		return !this.isEmptyString(this.serverName);
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
				groupName: this.serverGroup
			};

			this.callbacks.onConnect();
		} else {
			alert('invalid inputs'); //TODO: message box
		}
	}

	public cancel() {
		this.callbacks.onCancel();
		this.close();
	}

	public close() {
		jQuery('#connectionDialogModal').modal('hide');
	}

	public open() {
		jQuery('#connectionDialogModal').modal({ backdrop: true, keyboard: true });
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	public dispose(): void {
		this.toDispose = lifecycle.dispose(this.toDispose);
	}
}