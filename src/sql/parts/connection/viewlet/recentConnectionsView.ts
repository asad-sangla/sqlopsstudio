/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import errors = require('vs/base/common/errors');
import { IActionRunner } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { AdaptiveCollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import {TreeCreationUtils} from 'sql/parts/connection/viewlet/TreeCreationUtils';
import {TreeUpdateUtils} from 'sql/parts/connection/viewlet/TreeUpdateUtils';
const $ = builder.$;

/**
 * RecentConnections view implements the dynamic tree view.
 */
export class RecentConnectionsView extends AdaptiveCollapsibleViewletView {

	constructor(private viewTitle, public viewKey, actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService private messageService: IMessageService
	) {
		super(actionRunner, 150, false, viewTitle, keybindingService, contextMenuService);
}
	/**
	 * Render the view header
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(this.viewTitle).appendTo(titleDiv);

		super.renderHeader(container);
	}

	/**
	 * Render the view body
	 */
	public renderBody(container: HTMLElement): void {
		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'explorer-servers');
		this.tree = TreeCreationUtils.createConnectionTree(this.treeContainer, this._instantiationService, false);
		this.toDispose.push(this.tree.addListener2('selection', (event) => TreeUpdateUtils.OnTreeSelect(
			event,
			this.tree,
			this._connectionManagementService
		)));
		// Refresh Tree when these events are emitted
		this._connectionManagementService.onAddConnectionProfile(() => {
			TreeUpdateUtils.structuralTreeUpdate(this.tree, this.viewKey, this._connectionManagementService);
		});
		this._connectionManagementService.onConnect(() => {
			TreeUpdateUtils.structuralTreeUpdate(this.tree, this.viewKey, this._connectionManagementService);
		});
		this._connectionManagementService.onDeleteConnectionProfile(() => {
			TreeUpdateUtils.structuralTreeUpdate(this.tree, this.viewKey, this._connectionManagementService);
		});

		TreeUpdateUtils.structuralTreeUpdate(this.tree, this.viewKey, this._connectionManagementService);
	}

	private onError(err: any): void {
		if (errors.isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}
}