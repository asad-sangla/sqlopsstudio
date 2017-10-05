/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Modal } from 'sql/base/browser/ui/modal/modal';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { BackupModule } from 'sql/parts/disasterRecovery/backup/backup.module';
import { BACKUP_SELECTOR } from 'sql/parts/disasterRecovery/backup/backup.component';
import { DashboardComponentParams } from 'sql/services/bootstrap/bootstrapParams';
import { IBootstrapService } from 'sql/services/bootstrap/bootstrapService';
import { Builder } from 'vs/base/browser/builder';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ProviderConnectionInfo } from 'sql/parts/connection/common/providerConnectionInfo';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

export class BackupDialog extends Modal {
	private _bodyBuilder: Builder;
	private _backupTitle: string;
	private _uniqueSelector: string;
	private _moduleRef: any;
	private static _connectionUniqueId: number = 0;

	constructor(
		@IBootstrapService private _bootstrapService: IBootstrapService,
		@IThemeService private _themeService: IThemeService,
		@IPartService partService: IPartService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super('', TelemetryKeys.Backup, partService, telemetryService, { isAngular: true, hasErrors: true });
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'backup-dialog' }, (builder) => {
			this._bodyBuilder = builder;
		});
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
	}

	/**
	 * Get the bootstrap params and perform the bootstrap
	 */
	private bootstrapAngular(uri: string, connection: IConnectionProfile, bodyContainer: HTMLElement) {
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
		this._moduleRef.destroy();
		this._bodyBuilder.empty();
		this.hide();
	}

	/**
	 * Open the dialog
	 */
	public async open(connection: IConnectionProfile) {
		let uri = this._connectionManagementService.getConnectionId(connection)
			+ ProviderConnectionInfo.idSeparator
			+ 'backupId'
			+ ProviderConnectionInfo.nameValueSeparator
			+ BackupDialog._connectionUniqueId;

		BackupDialog._connectionUniqueId++;

		// Create connection if needed
		if (!this._connectionManagementService.isConnected(uri)) {
			try {
				await this._connectionManagementService.connect(connection, uri);
			} catch (e) {
				return Promise.reject(e);
			}
		}

		// Add angular component template to dialog body
		this.bootstrapAngular(uri, connection, this._bodyBuilder.getHTMLElement());
		this._backupTitle = 'Backup database - ' + connection.serverName + ':' + connection.databaseName;
		this.title = this._backupTitle;
		this.show();
	}

	protected layout(height?: number): void {
		// Nothing currently laid out in this class
	}

}