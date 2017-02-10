/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./bootstrap';
import 'vs/css!./bootstrap-theme';
import 'vs/css!./connectionDialog';
import { Dimension, Builder, $ } from 'vs/base/browser/builder';
import DOM = require('vs/base/browser/dom');
import { Button } from 'vs/base/browser/ui/button/button';
import { SelectBox } from 'vs/base/browser/ui/selectBox/selectBox';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import { ConnectionDialogModel } from './connectionDialogModel';
import * as lifecycle from 'vs/base/common/lifecycle';
import { Widget } from 'vs/base/browser/ui/widget';

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
}

export class ConnectionDialogWidget  {
	private builder: Builder;
	private container: HTMLElement;
	private modelElement: HTMLElement;
	private serverNameInputBox: InputBox;
	private databaseNameInputBox: InputBox;
	private userNameInputBox: InputBox;
	private passwordInputBox: InputBox;
	private jQuery;
	private callbacks: IConnectionDialogCallbacks;
	private model: ConnectionDialogModel;
	private toDispose: lifecycle.IDisposable[];
	private authTypeSelectBox: SelectBox;

	constructor(container: HTMLElement, callbacks: IConnectionDialogCallbacks){
		this.container = container;
		this.setCallbacks(callbacks);
		this.authTypeSelectBox = new SelectBox( ['Windows Authentication', 'SQL Server Authentication'], 1);
		//this.registerListeners();

		require(['jquery'], function(bootstrap2){
			this.jQuery = require('jquery');
		});
	}

	public create(): HTMLElement {
		this.builder = $().div({}, (div: Builder) => {
			div.div({class:'modal', id:'connectionDialogModal', 'role':'dialog'}, (dialogContainer) => {
				dialogContainer.div({class:'modal-dialog', role:'document'}, (modalDialog) => {
					modalDialog.div({class:'modal-content'}, (modelContent) => {
						modelContent.div({class:'modal-body'}, (modelBody) => {
							modelBody.element('table', {width:'100%'}, (tableContainer) => {
								this.serverNameInputBox = this.appendRow(tableContainer, 'Server Name', 'label', 'input') as InputBox;
								this.databaseNameInputBox = this.appendRow(tableContainer, 'Database Name', 'label', 'input') as InputBox;
								// this.appendRow(tableContainer, 'Auth type', 'auth-label', 'auth-input', false);
								this.userNameInputBox = this.appendRow(tableContainer, 'User Name', 'auth-label', 'auth-input') as InputBox;
								this.passwordInputBox = this.appendRow(tableContainer, 'Password', 'auth-label', 'auth-input') as InputBox;
								this.passwordInputBox.inputElement.type = 'password';
							});
						});
						modelContent.div({class:'modal-footer'}, (modelFooter) => {
							modelFooter.element('table', {align:'right'}, (tableContainer) => {
								tableContainer.element('tr', {}, (rowContainer) => {
									rowContainer.element('td', {class:'footer-button'}, (connectCellContainer) => {
										let connectButton = new Button(connectCellContainer);
										connectButton.label = 'Connect';
										connectButton.addListener2('click', () => {
												this.connect();
										});
									});
									rowContainer.element('td', {class:'footer-button'}, (closeCellContainer) => {
										let closeButton = new Button(closeCellContainer);
										closeButton.label = 'Cancel';
										closeButton.addListener2('click', () => {
											this.cancel();
										});
									});
								});
							});
						});
					});
				});
			});
		})
		.addClass('connection-dialog-widget')
		.build(this.container);
		this.modelElement = this.builder.getHTMLElement();
		return this.modelElement;
	}

	private registerListeners(): void {
		this.toDispose.push(this.authTypeSelectBox.onDidSelect(configurationName => {
			this.authTypeSelected();
		}));
	}

	private authTypeSelected() {
	}

	public getModel(): ConnectionDialogModel {
		return this.model;
	}

	public setModel(model: ConnectionDialogModel) {
		this.serverNameInputBox.value = model.serverName;
		this.databaseNameInputBox.value = model.databaseName;
		this.userNameInputBox.value = model.userName;
		this.passwordInputBox.value = model.password;
	}

	public getServerName(): string {
		return this.serverNameInputBox.value;
	}

	public getDatabaseName(): string {
		return this.databaseNameInputBox.value;
	}

	public getUserName(): string {
		return this.userNameInputBox.value;
	}

	public getPassword(): string {
		return this.passwordInputBox.value;
	}

	public setCallbacks(callbacks: IConnectionDialogCallbacks): void {
		this.callbacks = callbacks;
	}

	private appendRow(container: Builder, label: string, labelClass: string, inputClass: string, textInput: boolean = true): Widget {
		let widget: Widget;
		container.element('tr', {}, (rowContainer) => {
				rowContainer.element('td', {class:'connection-' + labelClass}, (labelCellContainer) => {
						labelCellContainer.div({}, (labelContainer) => {
								labelContainer.innerHtml(label);
						});
				});
				rowContainer.element('td', {class:'connection-' + inputClass}, (inputCellContainer) => {
					if(textInput === true) {
						widget = new InputBox(inputCellContainer.getHTMLElement(), null, {
						});
					} else {
						this.authTypeSelectBox.render(inputCellContainer.getHTMLElement());
					}
				});
		});

		return widget;
	}

	private validateInputs(): boolean {
		let isValid: boolean = true;

		let serverName = this.getServerName();
		let databaseName = this.getDatabaseName();
		let userName = this.getUserName();
		let password = this.getPassword();
		isValid = !this.isEmptyString(serverName) && !this.isEmptyString(databaseName) && !this.isEmptyString(userName) && !this.isEmptyString(password);

		return isValid;
	}

	private isEmptyString(value: string): boolean {
		//TODO find a better way to check for empty string
		return value === undefined || value === '';
	}

	public connect() {
		if (this.validateInputs()) {
			this.model = new ConnectionDialogModel(
				this.getServerName(),
				this.getDatabaseName(),
				this.getUserName(),
				this.getPassword()
			);
			this.callbacks.onConnect();
			this.close();
		} else {
			alert('invalid inputs'); //TODO: message box
		}
	}

	public cancel() {
		this.callbacks.onCancel();
		this.close();
	}

	public close() {
		require(['jquery', 'bootstrapUi'], function(jQuery){
			   jQuery('#connectionDialogModal').modal('hide');
		});
	}

	public open() {
		require(['jquery', 'bootstrapUi'], function(jQuery){
			   jQuery('#connectionDialogModal').modal({backdrop:false});
		});
	}

	public dispose(): void {
		this.toDispose = lifecycle.dispose(this.toDispose);
	}
}