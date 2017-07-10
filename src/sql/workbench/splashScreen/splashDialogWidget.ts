/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/splashScreen';
import { Modal } from 'sql/parts/common/modal/modal';
import * as DOM from 'vs/base/browser/dom';
import { IPartService } from 'vs/workbench/services/part/common/partService';

export class SplashDialogWidget extends Modal {
	constructor( @IPartService _partService: IPartService) {
		// render a body only modal
		super(undefined, _partService, {isFlyout: false, isAngular: true});
	}

	renderBody(container: HTMLElement) {
		let body = DOM.$('div.splash-modal');
		DOM.append(container, body);
	}

	public close() {
		this.hide();
	}

	public open() {
		this.show();
	}

	/* No op espace key */
	protected onClose() {
		// purposeful no op
	}

	/* no op enter key */
	protected onAccept() {
		// purposeful no op
	}
}
