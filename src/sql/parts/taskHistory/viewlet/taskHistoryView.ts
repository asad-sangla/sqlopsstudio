/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { IActionRunner, IAction } from 'vs/base/common/actions';
import dom = require('vs/base/browser/dom');
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { CollapsibleViewletView } from 'vs/workbench/browser/viewlet';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { AddServerAction, AddServerGroupAction, ActiveConnectionsFilterAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import * as builder from 'vs/base/browser/builder';
import { IMessageService } from 'vs/platform/message/common/message';
import Severity from 'vs/base/common/severity';
import { TreeCreationUtils } from 'sql/parts/registeredServer/viewlet/treeCreationUtils';
import { TreeUpdateUtils, TreeSelectionHandler } from 'sql/parts/taskHistory/viewlet/treeUpdateUtils';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { Button } from 'vs/base/browser/ui/button/button';
const $ = builder.$;

/**
 * TaskHistoryView implements the dynamic tree view.
 */
export class TaskHistoryView extends CollapsibleViewletView {

	public messages: builder.Builder;
	private addServerAction: IAction;
	private addServerGroupAction: IAction;
	private activeConnectionsFilterAction: ActiveConnectionsFilterAction;
	private _buttonSection: builder.Builder;
	private treeSelectionHandler: TreeSelectionHandler;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService messageService: IMessageService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService
	) {
		super(actionRunner, false, nls.localize({ key: 'taskHistorySection', comment: ['Task History Tree'] }, 'Task History Section'), messageService, keybindingService, contextMenuService);
		this.addServerAction = this.instantiationService.createInstance(AddServerAction,
			AddServerAction.ID,
			AddServerAction.LABEL);
		this.addServerGroupAction = this.instantiationService.createInstance(AddServerGroupAction,
			AddServerGroupAction.ID,
			AddServerGroupAction.LABEL);
		this.treeSelectionHandler = this.instantiationService.createInstance(TreeSelectionHandler);
	}

	/**
	 * Render header of the view
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('taskHistory', 'Task History')).appendTo(titleDiv);
		super.renderHeader(container);
	}

	/**
	 * Render the view body
	 */
	public renderBody(container: HTMLElement): void {
		// Add div to display no connections found message and hide it by default
		this.messages = $('div.title').appendTo(container);
		$('span').text('No connections found.').appendTo(this.messages);
		this.messages.hide();

		if (!this._connectionManagementService.hasRegisteredServers()) {
			this._buttonSection = $('div.button-section').appendTo(container);
			var connectButton = new Button(this._buttonSection);
			connectButton.label = 'Add Connection';
			connectButton.addListener2('click', () => {
				this._connectionManagementService.showConnectionDialog();
			});
		}

		this.treeContainer = super.renderViewTree(container);
		dom.addClass(this.treeContainer, 'servers-view');

		this.tree = TreeCreationUtils.createRegisteredServersTree(this.treeContainer, this.instantiationService);
		this.toDispose.push(this.tree.addListener2('selection', (event) => this.onSelected(event)));
		const self = this;
		// Refresh Tree when these events are emitted
		this.toDispose.push(this._connectionManagementService.onAddConnectionProfile(() => {
			if (this._buttonSection) {
				this._buttonSection.getHTMLElement().style.display = 'none';
			}
			self.refreshTree();
		})
		);
		this.toDispose.push(this._connectionManagementService.onDeleteConnectionProfile(() => {
			self.refreshTree();
		})
		);
		this.toDispose.push(this._connectionManagementService.onConnect((connectionParams) => {
			self.addObjectExplorerNodeAndRefreshTree(connectionParams.connectionProfile);
		})
		);
		this.toDispose.push(this._connectionManagementService.onDisconnect((connectionParams) => {
			self.deleteObjectExplorerNodeAndRefreshTree(connectionParams.connectionProfile);
		})
		);

		if (this._objectExplorerService && this._objectExplorerService.onUpdateObjectExplorerNodes) {
			this.toDispose.push(this._objectExplorerService.onUpdateObjectExplorerNodes(args => {
				if (args.connection) {
					self.onObjectExplorerSessionCreated(args.connection);
				}
			}));
		}
		self.refreshTree();
	}

	/**
	 * Return actions for the view
	 */
	public getActions(): IAction[] {
		return [];
	}

	private getConnectionInTreeInput(connectionId: string): ConnectionProfile {
		let root = TreeUpdateUtils.getTreeInput(this._connectionManagementService);
		let connections = ConnectionProfileGroup.getConnectionsInGroup(root);
		let results = connections.filter(con => {
			if (connectionId === con.id) {
				return true;
			} else {
				return false;
			}
		});
		if (results && results.length > 0) {
			return results[0];
		}
		return null;
	}

	private onObjectExplorerSessionCreated(connection: IConnectionProfile) {
		var conn = this.getConnectionInTreeInput(connection.id);
		if (conn) {
			this.tree.refresh(conn).then(() => {
				return this.tree.expand(conn).then(() => {
					return this.tree.reveal(conn, 0.5).then(() => {
					});
				});
			}).done(null, errors.onUnexpectedError);
		}
	}

	public addObjectExplorerNodeAndRefreshTree(connection: IConnectionProfile): void {
		this.messages.hide();
		if (!this._objectExplorerService.getObjectExplorerNode(connection)) {
			this._objectExplorerService.updateObjectExplorerNodes(connection).then(() => {
				// The oe request is sent. an event will be raised when the session is created
			}, error => {
			});
		}
	}

	public deleteObjectExplorerNodeAndRefreshTree(connection: IConnectionProfile): void {
		if (connection) {
			var conn = this.getConnectionInTreeInput(connection.id);
			if (conn) {
				this._objectExplorerService.deleteObjectExplorerNode(conn);
				this.tree.refresh(conn);
			}
		}
	}

	public refreshTree(): void {
		this.messages.hide();
		TreeUpdateUtils.registeredServerUpdate(this.tree, this._connectionManagementService);
	}

	/**
	 * Filter connections based on view (recent/active)
	 */
	private filterConnections(treeInput: ConnectionProfileGroup[], view: string): ConnectionProfileGroup[] {
		if (!treeInput || treeInput.length === 0) {
			return undefined;
		}
		let result = treeInput.map(group => {
			// Keep active/recent connections and remove the rest
			if (group.connections) {
				group.connections = group.connections.filter(con => {
					if (view === 'active') {
						return this._connectionManagementService.isConnected(undefined, con);
					} else if (view === 'recent') {
						return this._connectionManagementService.isRecent(con);
					}
					return false;
				});
			}
			group.children = this.filterConnections(group.children, view);
			// Remove subgroups that are undefined
			if (group.children) {
				group.children = group.children.filter(group => {
					return (group) ? true : false;
				});
			}
			// Return a group only if it has a filtered result or subgroup.
			if ((group.connections && group.connections.length > 0) || (group.children && group.children.length > 0)) {
				return group;
			}
			return undefined;
		});
		return result;
	}

	private onSelected(event: any): void {
		this.treeSelectionHandler.onTreeSelect(event, this.tree, this._connectionManagementService);
	}

	private onError(err: any): void {
		if (errors.isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}

	public dispose(): void {
		super.dispose();
	}
}