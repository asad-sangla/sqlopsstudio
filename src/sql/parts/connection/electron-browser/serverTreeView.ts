/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { IActionRunner } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';;
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { AdaptiveCollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { ServerTreeRenderer, ServerTreeDataSource, Server } from 'sql/parts/connection/electron-browser/serverTreeRenderer';
import { DefaultController, DefaultDragAndDrop, DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { TreeExplorerViewletState} from 'vs/workbench/parts/explorers/browser/views/treeExplorerViewer';
import * as builder from 'vs/base/browser/builder';
const $ = builder.$;
export class ServerTreeView extends AdaptiveCollapsibleViewletView {

	private fullRefreshNeeded: boolean;
	private viewletState: TreeExplorerViewletState;

	constructor(actionRunner: IActionRunner, settings: any,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
	) {
		//TODO: remove height values
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
		const renderer = this.instantiationService.createInstance(ServerTreeRenderer);
		const controller = new DefaultController();
		const dnd = new DefaultDragAndDrop();
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

		this.fullRefreshNeeded = true;
		this.structuralTreeUpdate();
	}

	private getServerGroups(): Server[] {
		// Stub method to generate input
		var s3: Server = new Server('3', 'Server name B', 'Azure', null);
		var s2: Server = new Server('2', 'Server name A', 'OnPrem', [s3]);
		var s5: Server = new Server('5', 'Server name D', 'Azure', null);
		var s6: Server = new Server('6', 'Server name E', 'OnPrem', null);
		var s4: Server = new Server('4', 'Server name C', 'Azure', [s5, s6]);
		return [s2, s4];
	}

	private structuralTreeUpdate(): void {
		const self = this;
		// TODO@Isidor temporary workaround due to a partial tree refresh issue
		this.fullRefreshNeeded = true;
		var root: Server = new Server('root', '', '', this.getServerGroups());
		const treeInput= root;
		(treeInput !== this.tree.getInput() ? this.tree.setInput(treeInput) : this.tree.refresh(root)).done(() => {
			self.fullRefreshNeeded = false;
			self.tree.getFocus();
		}, errors.onUnexpectedError);
	}
}