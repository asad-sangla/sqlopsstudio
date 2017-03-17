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
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IConnectionProfile } from 'sql/parts/connection/node/interfaces';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { TreeUtils } from 'sql/parts/connection/electron-browser/recentConnectionsController';
import { IConnectionManagementService, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import data = require('data');

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
	onShowUiComponent: () => HTMLElement;
	onInitDialog: () => void;
	onFillinConnectionInputs: (connectionInfo: IConnectionProfile) => void;
}

export class ConnectionDialogWidget {
	private _builder: Builder;
	private _container: HTMLElement;
	private _callbacks: IConnectionDialogCallbacks;
	private _connectButton: Button;
	private _closeButton: Button;
	private _dialog: ModalDialogBuilder;
	private _providerTypeSelectBox: ConnectionDialogSelectBox;
	private _sqlProviderType: string = 'SQL';
	private _toDispose: lifecycle.IDisposable[];
	private _newConnectionParams: INewConnectionParams;

	constructor(container: HTMLElement,
		callbacks: IConnectionDialogCallbacks,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService)
	{
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];

		var providerTypeOptions = [this._sqlProviderType];
		this._providerTypeSelectBox = new ConnectionDialogSelectBox(providerTypeOptions, this._sqlProviderType);
	}

	public create(): HTMLElement {
		this._dialog = new ModalDialogBuilder('connectionDialogModal', 'Connect to Server', 'connection-dialog-widget', 'connectionDialogBody');
		this._builder = this._dialog.create();
		this._dialog.addModalTitle();
		this._dialog.headerContainer.div({ class: 'Connection-type' }, (connectionTypeContainer) => {
			connectionTypeContainer.div({ class: 'ConnectionType-label'}, (labelContainer) => {
				labelContainer.innerHtml('Connection Type');
			});
			connectionTypeContainer.div({ class: 'ConnectionType-input'}, (inputContainer) => {
				this._providerTypeSelectBox.render(inputContainer.getHTMLElement());
			});
		});

		this._dialog.bodyContainer.div({class:'connection-recent', id: 'recentConnection'});
		this._dialog.addErrorMessage();
		this._dialog.bodyContainer.div({class:'connection-provider-info', id: 'connectionProviderInfo'});

		this._connectButton = this.createFooterButton(this._dialog.footerContainer, 'Connect');
		this._connectButton.enabled = false;
		this._closeButton = this.createFooterButton(this._dialog.footerContainer, 'Cancel');

		this._builder.build(this._container);
		this.registerListeners();
		this.onProviderTypeSelected(this._providerTypeSelectBox.value);

		return this._builder.getHTMLElement();
	}


	private registerListeners(): void {
		this._toDispose.push(this._providerTypeSelectBox.onDidSelect(selectedProviderType => {
			this.onProviderTypeSelected(selectedProviderType);
		}));
	}

	private onProviderTypeSelected(selectedProviderType: string) {
		// Show connection form based on server type
		jQuery('#connectionProviderInfo').empty();
		jQuery('#connectionProviderInfo').append(this._callbacks.onShowUiComponent);
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

	public connect(): void {
		this._connectButton.enabled = false;
		this._dialog.showSpinner();
		this._callbacks.onConnect();
	}

	public cancel() {
		this._callbacks.onCancel();
		this.close();
	}

	public close() {
		this.clearRecentConnection();
		jQuery('#connectionDialogModal').modal('hide');
	}

	private createRecentConnectionsBuilder(): Builder {
		var recentConnectionBuilder = $().div({ class: 'connection-recent-content' }, (recentConnectionContainer) => {
			recentConnectionContainer.div({class:'connection-history-label'}, (recentTitle) => {
				recentTitle.innerHtml('Recent History');
			});

			recentConnectionContainer.element('div', { class: 'server-explorer-viewlet' }, (divContainer: Builder) => {
				divContainer.element('div', { class: 'explorer-servers'}, (treeContainer: Builder) => {
					let recentConnectionTree = TreeUtils.createConnectionTree(treeContainer.getHTMLElement(), this._instantiationService, true);
					recentConnectionTree.addListener2('selection', (event: any) => this.OnRecentConnectionClick(event));
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

	private OnRecentConnectionClick(event: any) {
		let connectionInfo: IConnectionProfile = event.selection[0];
		if (connectionInfo) {
			this._callbacks.onFillinConnectionInputs(connectionInfo);
		}
	}

	private clearRecentConnection() {
		this._builder.off(DOM.EventType.KEY_DOWN);
		jQuery('#recentConnection').empty();
	}

	public open(recentConnections: data.ConnectionInfo[]) {
		this.clearRecentConnection();
		if(recentConnections.length > 0) {
			var recentConnectionBuilder = this.createRecentConnectionsBuilder();
			jQuery('#recentConnection').append(recentConnectionBuilder.getHTMLElement());
		}

		jQuery('#connectionDialogModal').modal({ backdrop: false, keyboard: true });
		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Enter)) {
				if (this._connectButton.enabled) {
					this.connect();
				}
			} else if (event.equals(KeyCode.Escape)) {
				this.cancel();
			}
		});
	}

	public set connectButtonEnabled(enable: boolean) {
		this._connectButton.enabled = enable;
	}

	public get connectButtonEnabled(): boolean {
		return this._connectButton.enabled;
	}

	public initDialog(): void {
		this._dialog.showError('');
		this._dialog.hideSpinner();
		this._callbacks.onInitDialog();
	}

	public showError(err: string) {
		this._dialog.showError(err);
		this._dialog.hideSpinner();
		this._connectButton.enabled = true;
	}

	public get newConnectionParams(): INewConnectionParams {
		return this._newConnectionParams;
	}

	public set newConnectionParams(params: INewConnectionParams) {
		this._newConnectionParams = params;
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}