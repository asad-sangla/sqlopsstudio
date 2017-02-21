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
import { ServerTreeRenderer, ServerTreeDataSource, ConnectionDisplay, ServerTreeDragAndDrop, ServerTreeModel, AddServerToGroupAction } from 'sql/parts/connection/electron-browser/serverTreeRenderer';
import { ServerTreeController, ServerTreeActionProvider } from 'sql/parts/connection/electron-browser/serverTreeController';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { TreeExplorerViewletState} from 'vs/workbench/parts/explorers/browser/views/treeExplorerViewer';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { QueryResultsInput } from 'sql/parts/query/common/queryResultsInput';
import { IUntitledEditorService } from 'vs/workbench/services/untitled/common/untitledEditorService';
const $ = builder.$;

/**
 * SErverTreeview implements the dynamic tree view.
 */
export class ServerTreeView extends AdaptiveCollapsibleViewletView {

	private fullRefreshNeeded: boolean;
	private viewletState: TreeExplorerViewletState;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private registeredServersService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService private messageService: IMessageService,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IUntitledEditorService private untitledEditorService: IUntitledEditorService
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

	/**
	 * Return actions for the view
	 */
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

	private openDatabase(server: ConnectionDisplay): void {
		// let connection = {
		// 	serverName: server.name,
		// 	databaseName: server.name,
		// 	userName: '',
		// 	password: ''
		// };
		// this.registeredServersService.open(connection, false).done(null, err => this.onError(err));

		const fileInput = this.untitledEditorService.createOrGet();
		const queryResultsInput: QueryResultsInput = this.instantiationService.createInstance(QueryResultsInput);
		let queryInput: QueryInput = this.instantiationService.createInstance(QueryInput, fileInput.getName(), '', fileInput, queryResultsInput);
		this.editorService.openEditor(queryInput);
	}

	/**
	 * Set input for the tree.
	 */
	private structuralTreeUpdate(): void {
		const self = this;
		// TODO@Isidor temporary workaround due to a partial tree refresh issue
		this.fullRefreshNeeded = true;
		const treeInput =  (ServerTreeModel.Instance).getTreeInput();
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