/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!./media/errorMessageDialog';
import { Modal } from 'sql/parts/common/modal/modal';
import { Builder } from 'vs/base/browser/builder';
import Severity from 'vs/base/common/severity';
import { clipboard } from 'electron';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

export class ErrorMessageDialog extends Modal {
	private _body: HTMLElement;
	private _severity: Severity;
	private _message: string;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super('', TelemetryKeys.ErrorMessage, partService, telemetryService, { isFlyout: false, hasTitleIcon: true });
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'error-dialog' }, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();;
		});
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		let copyButton = this.addFooterButton('Copy to Clipboard', () => clipboard.writeText(this._message), 'left');
		copyButton.icon = 'icon scriptToClipboard';
		attachButtonStyler(copyButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND });
		let okButton = this.addFooterButton('OK', () => this.ok());
		attachButtonStyler(okButton, this._themeService);
	}

	protected layout(height?: number): void {
		// Nothing to re-layout
	}

	private updateDialogBody(): void {
		let builder = new Builder(this._body).empty();
		builder.div({ class: 'error-message' }, (errorContainer) => {
			errorContainer.innerHtml(this._message);
		});
	}

	private updateIconTitle(): void {
		switch (this._severity) {
			case Severity.Error:
				this.titleIconClassName = 'icon error';
				break;
			case Severity.Warning:
				this.titleIconClassName = 'icon warning';
				break;
			case Severity.Info:
				this.titleIconClassName = 'icon info';
				break;
		}
	}

	/* espace key */
	protected onClose() {
		this.ok();
	}

	/* enter key */
	protected onAccept() {
		this.ok();
	}

	public ok(): void {
		this._onOk.fire();
		this.close();
	}

	public close() {
		this.hide();
	}

	public open(severity: Severity, headerTitle: string, message: string) {
		this._severity = severity;
		this._message = message;
		this.title = headerTitle;
		this.updateIconTitle();
		this.updateDialogBody();
		this.show();
	}

	public dispose(): void {
	}
}