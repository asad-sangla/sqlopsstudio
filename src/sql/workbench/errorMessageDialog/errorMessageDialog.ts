/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!./media/errorMessageDialog';
import { Button } from 'sql/base/browser/ui/button/button';
import { Modal } from 'sql/base/browser/ui/modal/modal';
import * as TelemetryKeys from 'sql/common/telemetryKeys';
import { attachButtonStyler, attachModalDialogStyler } from 'sql/common/theme/styler';

import { Builder } from 'vs/base/browser/builder';
import Severity from 'vs/base/common/severity';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { SIDE_BAR_BACKGROUND } from 'vs/workbench/common/theme';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { localize } from 'vs/nls';

export class ErrorMessageDialog extends Modal {
	private _body: HTMLElement;
	private _okButton: Button;
	private _copyButton: Button;
	private _severity: Severity;
	private _message: string;
	private _messageDatails: string;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;

	constructor(
		@IThemeService private _themeService: IThemeService,
		@IClipboardService private _clipboardService: IClipboardService,
		@IPartService partService: IPartService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService
	) {
		super('', TelemetryKeys.ErrorMessage, partService, telemetryService, contextKeyService, { isFlyout: false, hasTitleIcon: true });
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'error-dialog' }, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();;
		});
	}

	public render() {
		super.render();
		this._register(attachModalDialogStyler(this, this._themeService));
		let copyButtonLabel = localize('copyCallStack', 'Copy call stack');
		this._copyButton = this.addFooterButton(copyButtonLabel, () => this._clipboardService.writeText(this._messageDatails), 'left');
		this._copyButton.icon = 'icon scriptToClipboard';
		this._copyButton.getElement().title = copyButtonLabel;
		this._register(attachButtonStyler(this._copyButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND }));
		this._okButton = this.addFooterButton('OK', () => this.ok());
		this._register(attachButtonStyler(this._okButton, this._themeService));
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

	public open(severity: Severity, headerTitle: string, message: string, messageDetails: string) {
		this._severity = severity;
		this._message = message;
		this.title = headerTitle;
		this._messageDatails = messageDetails;
		if (this._messageDatails) {
			this._copyButton.getElement().style.visibility = 'visible';
		} else {
			this._copyButton.getElement().style.visibility = 'hidden';
		}
		this.updateIconTitle();
		this.updateDialogBody();
		this.show();
		this._okButton.focus();
	}

	public dispose(): void {
	}
}