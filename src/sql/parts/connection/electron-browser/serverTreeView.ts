/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { IActionRunner, IAction } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { AdaptiveCollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { ServerTreeRenderer, ServerTreeDataSource, Server, ServerGroup, ServerTreeDragAndDrop, AddServerToGroupAction } from 'sql/parts/connection/electron-browser/serverTreeRenderer';
import { ServerTreeController, ServerTreeActionProvider } from 'sql/parts/connection/electron-browser/serverTreeController';
import { DefaultController, DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { TreeExplorerViewletState} from 'vs/workbench/parts/explorers/browser/views/treeExplorerViewer';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
const $ = builder.$;

export class ServerTreeView extends AdaptiveCollapsibleViewletView {

	private fullRefreshNeeded: boolean;
	private viewletState: TreeExplorerViewletState;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private registeredServersService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService private messageService: IMessageService
	) {
		super(actionRunner, 22 * 15, false, nls.localize({ key: 'registeredServersSection', comment: ['Registered Servers Tree'] }, "Registered Servers Section"), keybindingService, contextMenuService);
}

	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('registeredServers', "Registered Servers")).appendTo(titleDiv);

		super.renderHeader(container);
	}

	public renderBody(container: HTMLElement): void {
		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'explorer-servers');

		const dataSource = this.instantiationService.createInstance(ServerTreeDataSource);
		this.viewletState = new TreeExplorerViewletState();
		const actionProvider = this.instantiationService.createInstance(ServerTreeActionProvider);
		const renderer = this.instantiationService.createInstance(ServerTreeRenderer);
		const controller = this.instantiationService.createInstance(ServerTreeController,actionProvider);
		const dnd = new ServerTreeDragAndDrop();
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
		this.toDispose.push(this.tree.addListener2('selection', () => this.onSelected()));
		this.fullRefreshNeeded = true;
		this.structuralTreeUpdate();
	}

	private getServerGroups(): [ServerGroup] {
		// Stub method to generate input
		var s3 = new Server('3', 'Server name B', 'Server name B','Azure');

		var s5 = new Server('5', 'Server name D', 'Server name D', 'Azure');
		var s6 = new Server('6', 'Server name E', 'Server name E', 'OnPrem');
		var s7 = new Server('7', 'Server name F', 'Server name F', 'OnPrem');
		var s8 = new ServerGroup('8', 'Server Group G','Server name G', 'OnPrem' , [s7]);
		var s2 = new ServerGroup('2', 'Server Group A','Server name A', 'OnPrem', [s3, s8]);
		var s4 = new ServerGroup('4', 'Server Group C', 'Server name C', 'Azure', [s5, s6]);
		console.log('get data');
		return [s2, s4 ];
	}

	public getActions(): IAction[] {
		return [
			this.instantiationService.createInstance(AddServerToGroupAction, AddServerToGroupAction.ID, AddServerToGroupAction.LABEL)
		];
	}

	private onSelected(): void {
		let selection = this.tree.getSelection();
		if (selection && selection.length > 0) {
			this.openDatabase(selection[0]);
		}
	}

	private openDatabase(server: Server): void {
		// let connection = {
		// 	serverName: server.name,
		// 	databaseName: server.name,
		// 	userName: '',
		// 	password: ''
		// };
		// this.registeredServersService.open(connection, false).done(null, err => this.onError(err));
	}

	private structuralTreeUpdate(): void {
		const self = this;
		// TODO@Isidor temporary workaround due to a partial tree refresh issue
		this.fullRefreshNeeded = true;
		var root = new ServerGroup('root', 'root', '', '', this.getServerGroups());
		//var serverModel = this.instantiationService.createInstance(ServerTreeModel, false, this.getServerGroups());
		const treeInput= root;
		(treeInput !== this.tree.getInput() ? this.tree.setInput(treeInput) : this.tree.refresh(root)).done(() => {
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