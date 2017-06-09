/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!sql/parts/common/flyoutDialog/media/flyoutDialog';
import { ModalDialogBuilder } from 'sql/parts/common/flyoutDialog/modalDialogBuilder';
import { ConnectionManagementInfo } from 'sql/parts/connection/common/connectionManagementInfo';
import { BackupModule } from 'sql/parts/disasterRecovery/backup/backup.module';
import { BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { Builder } from 'vs/base/browser/builder';
import * as lifecycle from 'vs/base/common/lifecycle';

export class BackupDialog {
	private _builder: Builder;
	private _container: HTMLElement;
	private _dialog: ModalDialogBuilder;
	private _toDispose: lifecycle.IDisposable[];
	private readonly _backupTitle = 'Backup Database';

	constructor(container: HTMLElement,
				@IBootstrapService private _bootstrapService: IBootstrapService) {
		this._container = container;
		this._toDispose = [];
	}

	public create(uri: string, connection: ConnectionManagementInfo): HTMLElement {
		this._dialog = new ModalDialogBuilder('backupDialogModal', this._backupTitle, 'backup-dialog', 'backupBody');
		this._builder = this._dialog.create(true, false);
		this._dialog.addModalTitle();

		// Add angular component template to dialog body
		this.bootstrapAngular(uri, connection, this._dialog.bodyContainer.getHTMLElement());

		this._dialog.addErrorMessage();
		this._builder.build(this._container);
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

		let uniqueSelector = this._bootstrapService.bootstrap(
			BackupModule,
			bodyContainer,
			BACKUP_SELECTOR,
			params);
	}

	private preventDefaultKeyboardEvent(e: KeyboardEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	public hideError() {
		this._dialog.showError('');
	}

	public showError(err: string) {
		this._dialog.showError(err);
	}

	public close() {
		jQuery('#backupDialogModal').modal('hide');
	}

	public open() {
		// reset the dialog
		this.hideError();
		this._dialog.setDialogTitle(this._backupTitle);
		jQuery('#backupDialogModal').modal({ backdrop: false, keyboard: true });
	}

	public dispose(): void {
		this._toDispose = lifecycle.dispose(this._toDispose);
	}
}