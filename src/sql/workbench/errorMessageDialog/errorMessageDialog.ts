/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
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

export class ErrorMessageDialog extends Modal {
	private _body: HTMLElement;
	private _severity: Severity;
	private _message: string;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService
	) {
		super('', partService, {isFlyout: false});
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'error-dialog'}, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();;
		});
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		let copyButton = this.addFooterButton('Copy to Clipboard', () => clipboard.writeText(this._message), 'left');
		copyButton.icon = 'copyButtonIcon';
		attachButtonStyler(copyButton, this._themeService, { buttonBackground: SIDE_BAR_BACKGROUND, buttonHoverBackground: SIDE_BAR_BACKGROUND });
		let okButton = this.addFooterButton('OK', () => this.ok());
		attachButtonStyler(okButton, this._themeService);
	}

	private updateDialogBody(): void {
		let builder = new Builder(this._body).empty();
		switch (this._severity) {
			case Severity.Error:
				builder.img({ 'class': 'error-icon' });
				break;
			case Severity.Warning:
				builder.img({ 'class': 'warning-icon' });
				break;
			case Severity.Info:
				builder.img({ 'class': 'info-icon' });
				break;
		}

		builder.div({ class: 'error-message' }, (errorContainer) => {
			errorContainer.innerHtml(this._message);
		});
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
		this.updateDialogBody();
		this.show();
	}

	public dispose(): void {
	}
}