/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { TPromise } from 'vs/base/common/winjs.base';
import WinJS = require('vs/base/common/winjs.base');
import nls = require('vs/nls');
import { ITree, ContextMenuEvent } from 'vs/base/parts/tree/browser/tree';
import treedefaults = require('vs/base/parts/tree/browser/treeDefaults');
import { IWorkbenchEditorService } from 'vs/workbench/services/editor/common/editorService';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { ContributableActionProvider } from 'vs/workbench/browser/actionBarRegistry';
import { IAction } from 'vs/base/common/actions';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IMouseEvent } from 'vs/base/browser/mouseEvent';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { keybindingForAction } from 'vs/workbench/parts/files/browser/fileActions';
import { Tree } from 'vs/base/parts/tree/browser/treeImpl';
import { DefaultFilter, DefaultAccessibilityProvider } from 'vs/base/parts/tree/browser/treeDefaults';
import { ServerTreeRenderer, ServerTreeDataSource } from 'sql/parts/connection/viewlet/serverTreeRenderer';
import { RecentConnectionsDragAndDrop } from 'sql/parts/connection/viewlet/recentConnectionsRenderer';
import { IConnectionManagementService, IConnectionCompletionOptions } from 'sql/parts/connection/common/connectionManagement';
import { EditDataAction } from 'sql/workbench/electron-browser/actions';
import { AddServerAction, NewQueryAction } from 'sql/parts/connection/viewlet/connectionTreeAction';
import { ICapabilitiesService } from 'sql/parts/capabilities/capabilitiesService';

/**
 * Extends the tree controller to handle clicks on the tree elements
 */
export class ConnectionTreeController extends treedefaults.DefaultController {

	constructor(private actionProvider: ConnectionTreeActionProvider,
		@IWorkbenchEditorService private editorService: IWorkbenchEditorService,
		@IContextMenuService private contextMenuService: IContextMenuService,
		@ITelemetryService private telemetryService: ITelemetryService,
		@IKeybindingService private keybindingService: IKeybindingService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
	) {
		super({ clickBehavior: treedefaults.ClickBehavior.ON_MOUSE_DOWN });
	}

	public onClick(tree: ITree, element: any, event: IMouseEvent): boolean {
		return super.onClick(tree, element, event);
	}

	protected onLeftClick(tree: ITree, element: any, event: IMouseEvent, origin: string = 'mouse'): boolean {
		return super.onLeftClick(tree, element, event, origin);
	}

	// Do not allow left / right to expand and collapse groups #7848
	protected onLeft(tree: ITree, event: IKeyboardEvent): boolean {
		return true;
	}

	protected onRight(tree: ITree, event: IKeyboardEvent): boolean {
		return true;
	}

	protected onEnter(tree: ITree, event: IKeyboardEvent): boolean {
		return super.onEnter(tree, event);
	}

	/**
	 * Return actions in the context menu
	 */
	public onContextMenu(tree: ITree, element: any, event: ContextMenuEvent): boolean {
		if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'input') {
			return false;
		}
		// Check if clicked on some element
		if (element === tree.getInput()) {
			return false;
		}

		event.preventDefault();
		event.stopPropagation();

		tree.setFocus(element);
		let parent: ConnectionProfileGroup = element.parent;
		let anchor = { x: event.posx + 1, y: event.posy };
		this.contextMenuService.showContextMenu({
			getAnchor: () => anchor,
			getActions: () => this.actionProvider.getActions(tree, element),
			getKeyBinding: (action) => keybindingForAction(action.id, this.keybindingService),
			onHide: (wasCancelled?: boolean) => {
				if (wasCancelled) {
					tree.DOMFocus();
				}
			},
			getActionsContext: () => (element)
		});

		return true;
	}
}

/**
 *  Provides actions for the server tree elements
 */
export class ConnectionTreeActionProvider extends ContributableActionProvider {

	constructor(
		@IInstantiationService private instantiationService: IInstantiationService
	) {
		super();
	}

	public hasActions(tree: ITree, element: any): boolean {
		return element instanceof ConnectionProfileGroup || (element instanceof ConnectionProfile);
	}

	public getActions(tree: ITree, element: any): TPromise<IAction[]> {
		return TPromise.as(TreeUtils.getConnectionActions(this.instantiationService));
	}

	public hasSecondaryActions(tree: ITree, element: any): boolean {
		return false;
	}

	public getSecondaryActions(tree: ITree, element: any): TPromise<IAction[]> {
		return super.getSecondaryActions(tree, element);
	}
}


export class TreeUtils {

	/**
	 * Create a recent/active connections tree
	 */
	public static createConnectionTree(treeContainer: HTMLElement, instantiationService: IInstantiationService, isCompact: boolean): Tree {
		const dataSource = instantiationService.createInstance(ServerTreeDataSource);
		const actionProvider = instantiationService.createInstance(ConnectionTreeActionProvider);
		const renderer = instantiationService.createInstance(ServerTreeRenderer, isCompact);
		const controller = instantiationService.createInstance(ConnectionTreeController, actionProvider);
		const dnd = instantiationService.createInstance(RecentConnectionsDragAndDrop);
		const filter = new DefaultFilter();
		const sorter = null;
		const accessibilityProvider = new DefaultAccessibilityProvider();

		return new Tree(treeContainer, {
			dataSource, renderer, controller, dnd, filter, sorter, accessibilityProvider
		}, {
				indentPixels: 10,
				twistiePixels: 20,
				ariaLabel: nls.localize({ key: 'treeAriaLabel', comment: ['Recent Connections'] }, 'Recent Connections')
			});

	}

	/**
	 * Handle selection of tree element
	 */
	public static OnTreeSelect(event: any, tree: ITree, connectionManagementService: IConnectionManagementService) {
		let selection = tree.getSelection();

		if (selection && selection.length > 0 && (selection[0] instanceof ConnectionProfile)) {
			let connectionProfile = <ConnectionProfile>selection[0];
			let isMouseOrigin = event.payload && (event.payload.origin === 'mouse');
			let isDoubleClick = isMouseOrigin && event.payload.originalEvent && event.payload.originalEvent.detail === 2;
			if (isDoubleClick) {
				if (!connectionManagementService.isProfileConnected(connectionProfile)) {
					let options: IConnectionCompletionOptions = {
						params: undefined,
						saveToSettings: false,
						showDashboard: true
					};
					connectionManagementService.connect(connectionProfile, undefined, options);
				}
				else {
					const connectionUri = 'connection://';
					let uri =  connectionUri + connectionProfile.getUniqueId();
					connectionManagementService.showDashboard(uri, connectionProfile);
				}
			}
		}
	}

	/**
	 * Set input for the tree.
	 */
	public static structuralTreeUpdate(tree: Tree, viewKey: string, connectionManagementService: IConnectionManagementService): WinJS.Promise {
		let groups;
		if (viewKey === 'recent') {
			groups = connectionManagementService.getRecentConnections();
		} else if (viewKey === 'active') {
			groups = connectionManagementService.getActiveConnections();
		}
		const treeInput = new ConnectionProfileGroup('root', null, undefined);
		treeInput.addConnections(TreeUtils.convertToConnectionProfile(groups));
		return tree.setInput(treeInput);
	}

	/**
	 * Convert interface to match connection management API
	 */
	public static convertToConnectionProfile(conns: ConnectionProfile[]): ConnectionProfile[] {
		let connections = [];

		conns.forEach((conn) => {
			connections.push(conn);
		});
		return connections;
	}

	/**
	 * Return actions for connection elements
	 */
	public static getConnectionActions(instantiationService: IInstantiationService): IAction[] {
		return [
			instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL),
			instantiationService.createInstance(NewQueryAction, NewQueryAction.ID, NewQueryAction.LABEL),
			instantiationService.createInstance(EditDataAction, EditDataAction.ID, EditDataAction.LABEL)
		];
	}

	/**
	 * Return actions for connection group elements
	 */
	public static getConnectionProfileGroupActions(instantiationService: IInstantiationService): IAction[] {
		return [
			instantiationService.createInstance(AddServerAction, AddServerAction.ID, AddServerAction.LABEL)
		];
	}

}