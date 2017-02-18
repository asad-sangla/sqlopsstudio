/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./bootstrap';
import 'vs/css!./bootstrap-theme';
import 'vs/css!./connectionDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { Checkbox } from 'vs/base/browser/ui/CheckBox/CheckBox';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import vscode = require('vscode');
import * as platform from 'vs/base/common/platform';

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
}

export class ConnectionDialogWidget  {
	private builder: Builder;
	private container: HTMLElement;
	private modelElement: HTMLElement;
	private serverGroupInputBox: InputBox;
	private serverNameInputBox: InputBox;
	private databaseNameInputBox: InputBox;
	private userNameInputBox: InputBox;
	private passwordInputBox: InputBox;
	private RememberPassword: Checkbox;
	private jQuery;
	private callbacks: IConnectionDialogCallbacks;
	private model: vscode.ConnectionInfo;
	private toDispose: lifecycle.IDisposable[];
	private authTypeSelectBox: SelectBox;
	private advancedButton: Button;
	private connectButton: Button;
	private closeButton: Button;
	private WindowsAuthTypeName: string = 'Windows Authentication';
	private SqlAuthTypeName: string = 'SQL Server Authentication';
	private selectedAuthType: string;

	constructor(container: HTMLElement, callbacks: IConnectionDialogCallbacks){
		this.container = container;
		this.setCallbacks(callbacks);
		this.toDispose = [];
		if(platform.isWindows) {
			this.authTypeSelectBox = new SelectBox( [this.WindowsAuthTypeName, this.SqlAuthTypeName], 0);
			this.selectedAuthType = this.WindowsAuthTypeName;
		} else {
			this.authTypeSelectBox = new SelectBox( [this.SqlAuthTypeName], 0);
			this.selectedAuthType = this.SqlAuthTypeName;
		}
	}

	public create(): HTMLElement {
		this.builder = $().div({}, (div: Builder) => {
			div.div({class:'modal', id:'connectionDialogModal', 'role':'dialog'}, (dialogContainer) => {
				dialogContainer.div({class:'modal-dialog ', role:'document'}, (modalDialog) => {
					modalDialog.div({class:'modal-content'}, (modelContent) => {
						modelContent.div({class:'modal-header'}, (modalHeader) => {
							modalHeader.element('button', {type:'button', class:'close', 'data-dismiss':'modal', 'aria-label':'close', 'aria-hidden':'true'}, (menuCloseButton) => {
									menuCloseButton.innerHtml('&times;');
							});
							modalHeader.div({class:'modal-title'}, (modalTitle) => {
								modalTitle.innerHtml('Connection Dialog');
							});
						});
						modelContent.div({class:'modal-body'}, (modelBody) => {
							modelBody.element('table', {width:'100%'}, (tableContainer) => {
								this.serverGroupInputBox = this.appendInputBox(this.appendRow(tableContainer, 'Add to Server group', 'label', 'input'));
								this.serverNameInputBox = this.appendInputBox(this.appendRow(tableContainer, 'Server Name', 'label', 'input'));
								this.appendInputSelectBox(this.appendRow(tableContainer, 'Authentication', 'auth-label', 'auth-input'), this.authTypeSelectBox);
								this.userNameInputBox = this.appendInputBox(this.appendRow(tableContainer, 'User Name', 'auth-label', 'auth-input'));
								this.passwordInputBox = this.appendInputBox(this.appendRow(tableContainer, 'Password', 'auth-label', 'auth-input'));
								this.passwordInputBox.inputElement.type = 'password';
								this.RememberPassword = this.appendCheckbox(tableContainer, 'Remember Password', 'auth-checkbox', 'auth-input');
								this.databaseNameInputBox = this.appendInputBox(this.appendRow(tableContainer, 'Database Name', 'auth-label', 'auth-input'));
								this.advancedButton = this.createAdvancedButton(tableContainer, 'Advanced...');
							});
						});
						modelContent.div({class:'modal-footer'}, (modelFooter) => {
							modelFooter.element('table', {align:'right'}, (tableContainer) => {
								tableContainer.element('tr', {}, (rowContainer) => {
									this.connectButton = this.createFooterButton(rowContainer, 'Connect');
									this.connectButton.enabled = false;
									this.closeButton = this.createFooterButton(rowContainer, 'Cancel');
								});
							});
						});
					});
				});
			});
		})
		.addClass('connection-dialog-widget')
		.build(this.container);
		this.registerListeners();
		this.modelElement = this.builder.getHTMLElement();
		this.serverNameInputBox.focus();

		this.onAuthTypeSelected(this.selectedAuthType);

		return this.modelElement;
	}

	private appendCheckbox(container: Builder, label: string, checkboxClass:string, cellContainerClass: string):Checkbox {
		let checkbox: Checkbox;
		container.element('tr', {}, (rowContainer) => {
				rowContainer.element('td');
				rowContainer.element('td', {class:'connection-' + cellContainerClass}, (inputCellContainer) => {
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
				rowContainer.element('td', {align:'right'}, (cellContainer) => {
					cellContainer.div({class:'advanced-button'}, (divContainer) => {
						button = new Button(divContainer);
						button.label = title;
						button.addListener2('click', () => {
							//open advanced page
						});
					});
				});
		});
		return button;
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', {class:'footer-button'}, (cellContainer) => {
			button = new Button(cellContainer);
			button.label = title;
			button.addListener2('click', () => {
				if(title === 'Connect') {
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
		this.selectedAuthType = selectedAuthType;
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

	public getConnection(): vscode.ConnectionInfo {
		return this.model;
	}

	public setConnection(model: vscode.ConnectionInfo) {
		this.serverNameInputBox.value = model.serverName;
		this.databaseNameInputBox.value = model.databaseName;
		this.userNameInputBox.value = model.userName;
		this.passwordInputBox.value = model.password;
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
		return this.selectedAuthType;
	}

	public setCallbacks(callbacks: IConnectionDialogCallbacks): void {
		this.callbacks = callbacks;
	}

	private appendRow(container: Builder, label: string, labelClass: string, cellContainerClass: string): Builder {
		let cellContainer: Builder;
		container.element('tr', {}, (rowContainer) => {
				rowContainer.element('td', {class:'connection-' + labelClass}, (labelCellContainer) => {
						labelCellContainer.div({}, (labelContainer) => {
								labelContainer.innerHtml(label);
						});
				});
				rowContainer.element('td', {class:'connection-' + cellContainerClass}, (inputCellContainer) => {
					cellContainer = inputCellContainer;
				});
		});

		return cellContainer;
	}

	private appendInputBox(container: Builder): InputBox {
		return new InputBox(container.getHTMLElement(), null, {});
	}

	private appendInputSelectBox(container: Builder, selectBox: SelectBox): SelectBox {
		selectBox.render(container.getHTMLElement());
		return selectBox;
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
				authenticationType: this.authenticationType
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
		jQuery('#connectionDialogModal').modal({backdrop:false});
	}

	public dispose(): void {
		this.toDispose = lifecycle.dispose(this.toDispose);
	}
}