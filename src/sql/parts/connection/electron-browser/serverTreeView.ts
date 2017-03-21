/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!./media/serverTreeActions';
import nls = require('vs/nls');
import * as data from 'data';
import errors = require('vs/base/common/errors');
import { IActionRunner, IAction } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { AdaptiveCollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { ConnectionProfileGroup } from '../node/connectionProfileGroup';
import { ConnectionProfile } from '../node/connectionProfile';
import { TreeUtils } from 'sql/parts/connection/electron-browser/recentConnectionsController';
import { AddServerAction, RecentConnectionsFilterAction, ActiveConnectionsFilterAction } from 'sql/parts/connection/electron-browser/connectionTreeAction';
import { ServerTreeRenderer, ServerTreeDataSource, ServerTreeDragAndDrop } from 'sql/parts/connection/electron-browser/serverTreeRenderer';
import { ServerTreeController, ServerTreeActionProvider } from 'sql/parts/connection/electron-browser/serverTreeController';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { TreeExplorerViewletState} from 'vs/workbench/parts/explorers/browser/views/treeExplorerViewer';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
const $ = builder.$;

/**
 * ServerTreeview implements the dynamic tree view.
 */
export class ServerTreeView extends AdaptiveCollapsibleViewletView {

	private fullRefreshNeeded: boolean;
	private viewletState: TreeExplorerViewletState;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService private messageService: IMessageService
	) {
		super(actionRunner, 22 * 15, false, nls.localize({ key: 'registeredServersSection', comment: ['Registered Servers Tree'] }, "Registered Servers Section"), keybindingService, contextMenuService);
}
	/**
	 * Render header of the view
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('registeredServers', "Registered Servers")).appendTo(titleDiv);
		super.renderHeader(container);
	}

	/**
	 * Render the view body
	 */
	public renderBody(container: HTMLElement): void {
		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'explorer-servers');

		const dataSource = this.instantiationService.createInstance(ServerTreeDataSource);
		this.viewletState = new TreeExplorerViewletState();
		const actionProvider = this.instantiationService.createInstance(ServerTreeActionProvider);
		const renderer = this.instantiationService.createInstance(ServerTreeRenderer, false);
		const controller = this.instantiationService.createInstance(ServerTreeController,actionProvider);
		const dnd = this.instantiationService.createInstance(ServerTreeDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		this.tree = new Tree(this.treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'treeAriaLabel', comment: ['Registered Servers'] }, "Registered Servers")
			});
		this.toDispose.push(this.tree.addListener2('selection', (event) => this.onSelected(event)));
		const self = this;
		// Refresh Tree when these events are emitted
		this._connectionManagementService.onAddConnectionProfile(() => {
			self.structuralTreeUpdate();
		});
		this._connectionManagementService.onDeleteConnectionProfile(() => {
			self.structuralTreeUpdate();
		});

		this.structuralTreeUpdate();
	}

	/**
	 * Return actions for the view
	 */
	public getActions(): IAction[] {
		return [
			this.instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL),
			this.instantiationService.createInstance(ActiveConnectionsFilterAction, ActiveConnectionsFilterAction.ID, ActiveConnectionsFilterAction.LABEL),
			this.instantiationService.createInstance(RecentConnectionsFilterAction, RecentConnectionsFilterAction.ID, RecentConnectionsFilterAction.LABEL),
		];
	}

	private onSelected(event: any): void {
		TreeUtils.OnTreeSelect(event, this.tree, this._connectionManagementService);
	}

	/**
	 * Set input for the tree.
	 */
	private structuralTreeUpdate(): void {
		const self = this;
		let groups = this._connectionManagementService.getConnectionGroups();
		// TODO@Isidor temporary workaround due to a partial tree refresh issue
		this.fullRefreshNeeded = true;
		const treeInput =  new ConnectionProfileGroup('root', null, 'root');
		treeInput.addGroups(groups);
		(treeInput !== this.tree.getInput() ? this.tree.setInput(treeInput) : this.tree.refresh()).done(() => {
			self.fullRefreshNeeded = false;
			self.tree.getFocus();
		}, errors.onUnexpectedError);
	}

	private onError(err: any): void {
		if (errors.isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}
}