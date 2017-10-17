/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Modal } from 'sql/base/browser/ui/modal/modal';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { BackupModule } from 'sql/parts/disasterRecovery/backup/backup.module';
import { BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { Builder } from 'vs/base/browser/builder';
import { IThemeService } from 'vs/platform/theme/common/themeService';

export class BackupDialog extends Modal {
	private _bodyBuilder: Builder;
	private _backupTitle: string;
	private _uniqueSelector: string;
	private _moduleRef: any;

	constructor(
		@IBootstrapService private _bootstrapService: IBootstrapService,
		@IThemeService private _themeService: IThemeService,
		@IPartService partService: IPartService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService
	) {
		super('', TelemetryKeys.Backup, partService, telemetryService, contextKeyService, { isAngular: true, hasErrors: true });
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'backup-dialog' }, (builder) => {
			this._bodyBuilder = builder;
		});
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);

		// Add angular component template to dialog body
		this.bootstrapAngular(this._bodyBuilder.getHTMLElement());
	}

	/**
	 * Get the bootstrap params and perform the bootstrap
	 */
	private bootstrapAngular(bodyContainer: HTMLElement) {
		this._uniqueSelector = this._bootstrapService.bootstrap(
			BackupModule,
			bodyContainer,
			BACKUP_SELECTOR,
			undefined,
			undefined,
			(moduleRef) => this._moduleRef = moduleRef);
	}

	public hideError() {
		this.showError('');
	}

	public showError(err: string) {
		this.showError(err);
	}

	/* Overwrite escape key behavior */
	protected onClose() {
		this.close();
	}

	/**
	 * Clean up the module and DOM element and close the dialog
	 */
	public close() {
		this.hide();
	}

	public dispose(): void {
		super.dispose();
		if (this._moduleRef) {
			this._moduleRef.destroy();
		}
	}

	/**
	 * Open the dialog
	 */
	public open(connection: IConnectionProfile) {
		this._backupTitle = 'Backup database - ' + connection.serverName + ':' + connection.databaseName;
		this.title = this._backupTitle;
		this.show();
	}

	protected layout(height?: number): void {
		// Nothing currently laid out in this class
	}

}