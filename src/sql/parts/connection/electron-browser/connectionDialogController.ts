/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/extensions';
import { TPromise } from 'vs/base/common/winjs.base';
import * as browser from 'vs/base/browser/browser';
import { Dimension, withElementById } from 'vs/base/browser/builder';
import DOM = require('vs/base/browser/dom');
import { WorkbenchComponent } from 'vs/workbench/common/component';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ITempConnectionDialogService } from 'sql/parts/connection/common/connectionDialogService';
import { IRegisteredServersService } from 'sql/parts/connection/common/registeredServers';
import { HideReason, ConnectionDialogWidget } from 'sql/parts/connection/electron-browser/connectionDialogWidget';

export class ConnectionDialogController extends WorkbenchComponent implements ITempConnectionDialogService {

	public _serviceBrand: any;

	private static ID = 'workbench.component.connectiondialog';

	private connectionDialog: ConnectionDialogWidget;

	private layoutDimensions: Dimension;

	constructor(
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IPartService private partService: IPartService
	) {
		super(ConnectionDialogController.ID);

		this.registerListeners();
	}

	private registerListeners(): void {
		this.toUnbind.push(this.partService.onTitleBarVisibilityChange(() => this.positionConnectionDialog()));
		this.toUnbind.push(browser.onDidChangeZoomLevel(() => this.positionConnectionDialog()));
	}

	public showDialog(registeredServersService: IRegisteredServersService): TPromise<void> {
		if (this.connectionDialog && this.connectionDialog.isVisible()) {
			this.connectionDialog.hide(HideReason.CANCELED);
		}

		return new TPromise<void>(() => {
			this.doShowDialog(registeredServersService);
		});
	}

	private doShowDialog(registeredServersService: IRegisteredServersService): TPromise<void> {

		// Create upon first open
		if (!this.connectionDialog) {
			this.connectionDialog = new ConnectionDialogWidget(
				withElementById(this.partService.getWorkbenchElementId()).getHTMLElement(),
				{
					onOk: () => {
						registeredServersService.addRegisteredServer(this.connectionDialog.getConnection())
					},
					onCancel: () => { /* ignore, handle later */ },
					onType: (value: string) => { /* ignore, handle later */ },
					onShow: () => { },
					onHide: (reason) => { }
				}
			);

			const connectionDialogContainer = this.connectionDialog.create();
			DOM.addClass(connectionDialogContainer, 'show-file-icons');
			this.positionConnectionDialog();
		}

		// Layout
		if (this.layoutDimensions) {
			this.connectionDialog.layout(this.layoutDimensions);
		}

		return new TPromise<void>((complete, error, progress) => {
			this.connectionDialog.show();
		});
	}

	private positionConnectionDialog(): void {
		const titlebarOffset = this.partService.getTitleBarOffset() + 100;

		if (this.connectionDialog) {
			this.connectionDialog.getElement().style('top', `${titlebarOffset}px`);
		}
	}

	public layout(dimension: Dimension): void {
		this.layoutDimensions = dimension;

		if (this.connectionDialog) {
			this.connectionDialog.layout(this.layoutDimensions);
		}
	}

	public dispose(): void {

		if (this.connectionDialog) {
			this.connectionDialog.dispose();
		}

		super.dispose();
	}
}
