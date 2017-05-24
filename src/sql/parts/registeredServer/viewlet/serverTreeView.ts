/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/serverTreeActions';
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
import { TreeUpdateUtils } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';
import { IObjectExplorerService } from 'sql/parts/registeredServer/common/objectExplorerService';
import { IConnectionProfile } from 'sql/parts/connection/common/interfaces';
import { Button } from 'vs/base/browser/ui/button/button';
const $ = builder.$;

/**
 * ServerTreeview implements the dynamic tree view.
 */
export class ServerTreeView extends CollapsibleViewletView {

	public messages: builder.Builder;
	private addServerAction: IAction;
	private addServerGroupAction: IAction;
	private activeConnectionsFilterAction: ActiveConnectionsFilterAction;
	private _buttonSection: builder.Builder;

	constructor(actionRunner: IActionRunner, settings: any,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IMessageService messageService: IMessageService,
		@IObjectExplorerService private _objectExplorerService: IObjectExplorerService
	) {
		super(actionRunner, false, nls.localize({ key: 'registeredServersSection', comment: ['Registered Servers Tree'] }, "Registered Servers Section"), messageService, keybindingService, contextMenuService);
		this.addServerAction = this.instantiationService.createInstance(AddServerAction,
			AddServerAction.ID,
			AddServerAction.LABEL);
		this.addServerGroupAction = this.instantiationService.createInstance(AddServerGroupAction,
			AddServerGroupAction.ID,
			AddServerGroupAction.LABEL);
		this.activeConnectionsFilterAction = this.instantiationService.createInstance(
			ActiveConnectionsFilterAction,
			ActiveConnectionsFilterAction.ID,
			ActiveConnectionsFilterAction.LABEL,
			this);
	}

	/**
	 * Render header of the view
	 */
	public renderHeader(container: HTMLElement): void {
		const titleDiv = $('div.title').appendTo(container);
		$('span').text(nls.localize('registeredServers', "Server Groups")).appendTo(titleDiv);
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
		return [this.addServerAction, this.addServerGroupAction, this.activeConnectionsFilterAction];
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
				// TODO stop the spinner
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
		this.clearOtherActions();
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

	/**
	 * Set tree elements based on the view (recent/active)
	 */
	public showFilteredTree(view: string): void {

		const self = this;
		this.messages.hide();
		// Clear other action views if user switched between two views
		this.clearOtherActions(view);
		let root = TreeUpdateUtils.getTreeInput(this._connectionManagementService);
		if (root) {
			// Filter results based on view
			let filteredResults = this.filterConnections([root], view);
			if (!filteredResults || !filteredResults[0]) {
				this.messages.show();
				this.messages.domFocus();
			}
			let treeInput = filteredResults[0];
			this.tree.setInput(treeInput).done(() => {
				if (this.messages.isHidden()) {
					self.tree.getFocus();
					self.tree.expandAll(ConnectionProfileGroup.getSubgroups(treeInput));
				} else {
					self.tree.clearFocus();
				}
			}, errors.onUnexpectedError);
		} else {
			//no op
		}
	}

	/**
	* Searches and sets the tree input to the results
	*/
	public searchTree(searchString: string): void {
		if (!searchString) {
			return;
		}
		const self = this;
		this.messages.hide();
		// Clear other actions if user searched during other views
		this.clearOtherActions();
		// Filter connections based on search
		let filteredResults = this.searchConnections(searchString);
		if (!filteredResults || filteredResults.length === 0) {
			this.messages.show();
			this.messages.domFocus();
		}
		// Add all connections to tree root and set tree input
		let treeInput = new ConnectionProfileGroup('searchroot', undefined, 'searchroot', undefined, undefined);
		treeInput.addConnections(filteredResults);
		this.tree.setInput(treeInput).done(() => {
			if (this.messages.isHidden()) {
				self.tree.getFocus();
				self.tree.expandAll(ConnectionProfileGroup.getSubgroups(treeInput));
			} else {
				self.tree.clearFocus();
			}
		}, errors.onUnexpectedError);
	}

	/**
	 * Searches through all the connections and returns a list of matching connections
	 */
	private searchConnections(searchString: string): ConnectionProfile[] {

		let root = TreeUpdateUtils.getTreeInput(this._connectionManagementService);
		let connections = ConnectionProfileGroup.getConnectionsInGroup(root);
		let results = connections.filter(con => {
			if (searchString && (searchString.length > 0)) {
				return this.isMatch(con, searchString);
			} else {
				return false;
			}
		});
		return results;
	}

	/**
	 * Returns true if the connection matches the search string.
	 * For now, the search criteria is true if the
	 * server name or database name contains the search string (ignores case).
	 */
	private isMatch(connection: ConnectionProfile, searchString: string): boolean {
		searchString = searchString.trim().toLocaleUpperCase();
		if ((connection.databaseName.toLocaleUpperCase()).includes(searchString) || (connection.serverName.toLocaleUpperCase()).includes(searchString)) {
			return true;
		}
		return false;
	}

	/**
	 * Clears the toggle icons for active and recent
	 */
	private clearOtherActions(view?: string) {
		if (!view) {
			this.activeConnectionsFilterAction.isSet = false;
		}
		if (view === 'recent') {
			this.activeConnectionsFilterAction.isSet = false;
		}
	}

	private onSelected(event: any): void {
		TreeUpdateUtils.OnTreeSelect(event, this.tree, this._connectionManagementService);
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