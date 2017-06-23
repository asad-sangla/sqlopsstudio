/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!sql/parts/common/flyoutDialog/media/flyoutDialog';
import { NgModuleRef } from '@angular/core';
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { BackupModule } from 'sql/parts/disasterRecovery/backup/backup.module';
import { BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { Builder } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import { StandardKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import * as lifecycle from 'vs/base/common/lifecycle';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';

export class BackupDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _dialog: ModalDialogBuilder;
	private _toDispose: lifecycle.IDisposable[];
	private _backupTitle: string;
	private _uniqueSelector: string;
	private _moduleRef: any;

	constructor(container: HTMLElement,
				@IBootstrapService private _bootstrapService: IBootstrapService) {
		this._container = container;
		this._toDispose = [];
	}

	public create(connection: ConnectionManagementInfo): HTMLElement {
		this._dialog = new ModalDialogBuilder('backupDialogModal', '', 'backup-dialog', 'backupBody');
		this._builder = this._dialog.create(true, true);
		this._dialog.addModalTitle();
		this._builder.build(this._container);

		this._builder.on(DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			let event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.Escape)) {
				this.close();
			}
		});

		return this._builder.getHTMLElement();
	}

	/**
	 * Get the bootstrap params and perform the bootstrap
	 */
	private bootstrapAngular(uri: string, connection: ConnectionManagementInfo, bodyContainer: HTMLElement){
		let params: DashboardComponentParams = {
			connection: connection,
			ownerUri: uri
		};

		this._uniqueSelector = this._bootstrapService.bootstrap(
			BackupModule,
			bodyContainer,
			BACKUP_SELECTOR,
			params,
			undefined,
			(moduleRef) => this.setModuleRef(moduleRef));
	}

	public setModuleRef(moduleRef: NgModuleRef<{}>) {
		this._moduleRef = moduleRef;
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	/**
	 * Clean up the module and DOM element and close the dialog
	 */
	public close() {
		this._moduleRef.destroy();
		$(this._uniqueSelector).remove();
		jQuery('#backupDialogModal').modal('hide');
	}

	/**
	 * Bootstrap angular component and open the dialog
	 */
	public open(uri: string, connection: ConnectionManagementInfo) {
		// Add angular component template to dialog body
		this.bootstrapAngular(uri, connection, this._dialog.bodyContainer.getHTMLElement());
		this._backupTitle = 'Backup Database - ' + connection.connectionProfile.serverName + ':' + connection.connectionProfile.databaseName;
		this._dialog.setDialogTitle(this._backupTitle);
		jQuery('#backupDialogModal').modal({ backdrop: false, keyboard: true });
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}

	private preventDefaultKeyboardEvent(e: KeyboardEvent) {
		e.preventDefault();
		e.stopPropagation();
	}
}
