/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import 'vs/css!sql/parts/registeredServer/viewlet/media/serverTreeActions';
import errors = require('vs/base/common/errors');
import nls = require('vs/nls');
import { IActionRunner, IAction } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { CollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ObjectExplorerUtils } from 'sql/parts/objectExplorer/viewlet/objectExplorerUtils';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { AddServerAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import Severity from 'vs/base/common/severity';
const $ = builder.$;

/**
 * ObjectExplorer view implements the dynamic tree view.
 */
export class ObjectExplorerView extends CollapsibleViewletView {

	private _addServerAction: AddServerAction;
	private _rootNode: TreeNode;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService messageService: IMessageService,

	) {
		super(actionRunner, false, nls.localize({ key: 'objectExplorerSection', comment: ['Object Explorer Tree'] }, "Object Explorer Section"), messageService, keybindingService, contextMenuService);
		this._addServerAction = this._instantiationService.createInstance(AddServerAction,
			AddServerAction.ID,
			AddServerAction.LABEL);
		this._rootNode = this._objectExplorerService.createTreeRoot();
	}

	/**
	 * Render the view header
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('objectExplorer', 'Connections')).appendTo(titleDiv);

		super.renderHeader(container);
	}

	/**
	 * Render the view body
	 */
	public renderBody(container: HTMLElement): void {
		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'explorer-servers');
		this.tree = ObjectExplorerUtils.createObjectExplorerTree(this.treeContainer, this._instantiationService, false);
		this.toDispose.push(this.tree.addListener2('selection', (event) => ObjectExplorerUtils.onTreeSelect(
			event,
			this.tree,
			this._connectionManagementService
		)));
		const self = this;
		// Refresh Tree when these events are emitted
		this._connectionManagementService.onAddConnectionProfile(() => {
			self.structuralTreeUpdate();
		});
		this._connectionManagementService.onConnect(() => {
			self.structuralTreeUpdate();
		});
		this._connectionManagementService.onDisconnect((disconnectParams) => {
			self.structuralTreeUpdate();
		});

		this.structuralTreeUpdate();
	}

	/**
	 * Return actions for the view
	 */
	public getActions(): IAction[] {
		return [this._addServerAction];
	}

	/**
	 * Set input for the tree.
	 */
	private structuralTreeUpdate(): void {
		let selectedElement: TreeNode;
		let targetsToExpand: TreeNode[];
		if (this.tree) {
			let selection = this.tree.getSelection();
			if (selection && selection.length === 1) {
				selectedElement = <TreeNode>selection[0];
			}
			targetsToExpand = this.tree.getExpandedElements();
		}

		let groups;
		groups = this._connectionManagementService.getActiveConnections();

		let connections = ObjectExplorerUtils.convertToConnectionProfile(groups);
		var treeInput = this._rootNode;

		let promises = connections.map(connection => {
			return this._connectionManagementService.addSavedPassword(connection).then(withPassword => {
				let connectionProfile = ConnectionProfile.convertToConnectionProfile(connection.ServerCapabilities, withPassword);
				return this._objectExplorerService.getRootTreeNode(treeInput, connectionProfile);
			});

		});
		Promise.all(promises).then(() => {
			if (treeInput !== this.tree.getInput()) {
				this.tree.setInput(treeInput).done(() => {
					// Make sure to expand all folders that where expanded in the previous session
					if (targetsToExpand) {
						this.tree.expandAll(targetsToExpand);
					}
					if (selectedElement) {
						this.tree.select(selectedElement);
					}
					this.tree.getFocus();
				}, errors.onUnexpectedError);
			} else {
				this.tree.refresh().done(() => {
					this.tree.getFocus();
				}, errors.onUnexpectedError);
			}
		});
	}

	private onError(err: any): void {
		if (errors.isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}

}