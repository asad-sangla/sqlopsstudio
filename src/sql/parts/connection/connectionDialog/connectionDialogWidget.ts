/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/connectionDialog';
import { Builder, $ } from 'vs/base/browser/builder';
import { Button } from 'vs/base/browser/ui/button/button';
import { ConnectionDialogSelectBox } from 'sql/parts/connection/connectionDialog/connectionDialogSelectBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { ModalDialogBuilder } from 'sql/parts/connection/connectionDialog/modalDialogBuilder';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import DOM = require('vs/base/browser/dom');
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { KeyCode } from 'vs/base/common/keyCodes';
import { IConnectionManagementService, INewConnectionParams } from 'sql/parts/connection/common/connectionManagement';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { ConnectionDialogHelper } from 'sql/parts/connection/connectionDialog/connectionDialogHelper';
import { TreeCreationUtils } from 'sql/parts/registeredServer/viewlet/treeCreationUtils';
import { TreeUpdateUtils } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';
import data = require('data');

export interface IConnectionDialogCallbacks {
	onConnect: () => void;
	onCancel: () => void;
	onShowUiComponent: (selectedProviderType: string) => HTMLElement;
	onInitDialog: () => void;
	onFillinConnectionInputs: (connectionInfo: IConnectionProfile) => void;
	onResetConnection: () => void;
}

export class ConnectionDialogWidget {
	private _builder: Builder;
	private _container: HTMLElement;
	private _callbacks: IConnectionDialogCallbacks;
	private _connectButton: Button;
	private _closeButton: Button;
	private _dialog: ModalDialogBuilder;
	private _providerTypeSelectBox: ConnectionDialogSelectBox;
	private _toDispose: lifecycle.IDisposable[];
	private _newConnectionParams: INewConnectionParams;

	constructor(container: HTMLElement,
		callbacks: IConnectionDialogCallbacks,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService) {
		this._container = container;
		this._callbacks = callbacks;
		this._toDispose = [];
	}

	public create(providerTypeOptions: string[], selectedProviderType: string): HTMLElement {
		this._providerTypeSelectBox = new ConnectionDialogSelectBox(providerTypeOptions, selectedProviderType);

		this._dialog = new ModalDialogBuilder('connectionDialogModal', 'New Connection', 'connection-dialog-widget', 'connectionDialogBody');
		this._builder = this._dialog.create();
		this._dialog.addModalTitle();

		this._dialog.bodyContainer.div({ class: 'connection-recent', id: 'recentConnection' });
		this._dialog.addErrorMessage();
		this._dialog.bodyContainer.div({ class: 'Connection-type' }, (modelTableContent) => {
			modelTableContent.element('table', { class: 'connection-table-content' }, (tableContainer) => {
				ConnectionDialogHelper.appendInputSelectBox(
					ConnectionDialogHelper.appendRow(tableContainer, 'Connection Type', 'connection-label', 'connection-input'), this._providerTypeSelectBox);
			});
		});

		this._dialog.bodyContainer.div({ class: 'connection-provider-info', id: 'connectionProviderInfo' });

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
		jQuery('#connectionProviderInfo').append(this._callbacks.onShowUiComponent(selectedProviderType));
		this.initDialog();
	}

	private createFooterButton(container: Builder, title: string): Button {
		let button;
		container.element('td', (cellContainer) => {
			cellContainer.div({ class: 'footer-button' }, (buttonContainer) => {
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
		this.resetConnection();
		this.clearRecentConnection();
		jQuery('#connectionDialogModal').modal('hide');
	}

	private createRecentConnectionsBuilder(): Builder {
		var recentConnectionBuilder = $().div({ class: 'connection-recent-content' }, (recentConnectionContainer) => {
			recentConnectionContainer.div({ class: 'connection-history-label' }, (recentTitle) => {
				recentTitle.innerHtml('Recent History');
			});

			recentConnectionContainer.element('div', { class: 'server-explorer-viewlet' }, (divContainer: Builder) => {
				divContainer.element('div', { class: 'explorer-servers' }, (treeContainer: Builder) => {
					let recentConnectionTree = TreeCreationUtils.createConnectionTree(treeContainer.getHTMLElement(), this._instantiationService, true);
					recentConnectionTree.addListener2('selection', (event: any) => this.OnRecentConnectionClick(event));
					recentConnectionTree.addListener2('selection',
						(event: any) => {
							this.onRecentConnectionDoubleClick(event, recentConnectionTree);
						});
					TreeUpdateUtils.structuralTreeUpdate(recentConnectionTree, 'recent', this._connectionManagementService);
					// call layout with view height
					recentConnectionTree.layout(300);
					divContainer.append(recentConnectionTree.getHTMLElement());
				});
			});
		});
		return recentConnectionBuilder;
	}

	private onRecentConnectionDoubleClick(event: any, recentConnectionTree: Tree) {
		let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
		let isDoubleClick = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
		if (isDoubleClick) {
			this.connect();
		}
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
		if (recentConnections.length > 0) {
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
		this.initDialog();
	}

	public set connectButtonEnabled(enable: boolean) {
		this._connectButton.enabled = enable;
	}

	public get connectButtonEnabled(): boolean {
		return this._connectButton.enabled;
	}

	private initDialog(): void {
		this._dialog.showError('');
		this._dialog.hideSpinner();
		this._callbacks.onInitDialog();
	}

	public showError(err: string) {
		this._dialog.showError(err);
		this.resetConnection();
	}

	public resetConnection() {
		this._dialog.hideSpinner();
		this._connectButton.enabled = true;
		this._callbacks.onResetConnection();
	}

	public get newConnectionParams(): INewConnectionParams {
		return this._newConnectionParams;
	}

	public set newConnectionParams(params: INewConnectionParams) {
		this._newConnectionParams = params;
	}

	public updateProvider(displayName: string) {
		this._providerTypeSelectBox.selectWithOptionName(displayName);
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}
