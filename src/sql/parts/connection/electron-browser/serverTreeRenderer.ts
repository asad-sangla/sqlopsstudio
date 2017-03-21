/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import dom = require('vs/base/browser/dom');
import { ConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { QueryInput } from 'sql/parts/query/common/queryInput';
import { TPromise } from 'vs/base/common/winjs.base';
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
import { IConnectionProfileGroupTemplateData, IConnectionTemplateData } from 'sql/parts/connection/electron-browser/templateData';
import { ActionBar } from 'vs/base/browser/ui/actionbar/actionbar';
import { ChangeConnectionAction, NewQueryAction } from 'sql/parts/connection/electron-browser/connectionTreeAction';
const $ = dom.$;

/**
 * Renders the tree items.
 * Uses the dom template to render connection groups and connections.
 */
export class ServerTreeRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 62;
	public static CONNECTION_GROUP_HEIGHT = 32;
	private static CONNECTION_TEMPLATE_ID = 'connection';
	private static CONNECTION_GROUP_TEMPLATE_ID = 'ConnectionProfileGroup';
	private _isCompact: boolean = false;

	constructor(isCompact: boolean,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
		// isCompact defaults to false unless explicitly set by instantiation call.
		if (isCompact) {
			this._isCompact = isCompact;
		}
	}

	/**
	 * Returns the element's height in the tree, in pixels.
	 */
	public getHeight(tree: ITree, element: any): number {
		if (element instanceof ConnectionProfileGroup) {
			return ServerTreeRenderer.CONNECTION_GROUP_HEIGHT;
		}
		return ServerTreeRenderer.CONNECTION_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		if (element instanceof ConnectionProfileGroup) {
			return ServerTreeRenderer.CONNECTION_GROUP_TEMPLATE_ID;
		}
		return ServerTreeRenderer.CONNECTION_TEMPLATE_ID;
	}

	/**
	 * Render template in a dom element based on template id
	 */
	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		if (templateId === ServerTreeRenderer.CONNECTION_TEMPLATE_ID) {
			const root = dom.append(container, $('.editor-group'));
			const serverName = dom.append(root, $('span.name'));
			const databaseName = dom.append(root, $('div.author.ellipsis'));
			if (!this._isCompact) {
				const actionOptions = { icon: true, label: true };
				const actionbar = new ActionBar(root, {
					animated: false
				});
				const connectAction = this._instantiationService.createInstance(ChangeConnectionAction);
				const newQueryAction = this._instantiationService.createInstance(NewQueryAction, NewQueryAction.ID, NewQueryAction.LABEL);
				actionbar.push([connectAction, newQueryAction], actionOptions);
				return {
					root,
					serverName,
					databaseName,
					set connectionProfile(profile: ConnectionProfile) {
						connectAction.connectionProfile = profile;
						newQueryAction.connectionProfile = profile;
					}
				};
			}
			return {
				root,
				serverName,
				databaseName,
				set connectionProfile(profile: ConnectionProfile) {
					//no op
				}
			};
		}
		else {
			const groupTemplate: IConnectionProfileGroupTemplateData = Object.create(null);
			groupTemplate.root = dom.append(container, $('.server-group'));
			groupTemplate.name = dom.append(groupTemplate.root, $('span.name'));
			return groupTemplate;
		}
	}

	/**
	 * Render a element, given an object bag returned by the template
	 */
	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		if (templateId === ServerTreeRenderer.CONNECTION_TEMPLATE_ID) {
			this.renderConnection(tree, element, templateData);
		}
		else {
			this.renderConnectionProfileGroup(tree, element, templateData);
		}
	}

	private renderConnection(tree: ITree, connection: ConnectionProfile, templateData: IConnectionTemplateData): void {
		templateData.serverName.textContent = connection.serverName;
		templateData.databaseName.textContent = connection.databaseName;
		templateData.connectionProfile = connection;
	}

	private renderConnectionProfileGroup(tree: ITree, connectionProfileGroup: ConnectionProfileGroup, templateData: IConnectionProfileGroupTemplateData): void {
		templateData.name.textContent = connectionProfileGroup.name;
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

/**
 * Implements the DataSource(that returns a parent/children of an element) for the server tree
 */
export class ServerTreeDataSource implements IDataSource {

	/**
	 * Returns the unique identifier of the given element.
	 * No more than one element may use a given identifier.
	 */
	public getId(tree: ITree, element: any): string {
		if (element instanceof ConnectionProfile) {
			return (<ConnectionProfile>element).id;
		} else if (element instanceof ConnectionProfileGroup) {
			return (<ConnectionProfileGroup>element).id;
		} else {
			return undefined;
		}
	}

	/**
	 * Returns a boolean value indicating whether the element has children.
	 */
	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof ConnectionProfile) {
			return false;
		} else if (element instanceof ConnectionProfileGroup) {
			return element.hasChildren();
		}
		return false;
	}

	/**
	 * Returns the element's children as an array in a promise.
	 */
	public getChildren(tree: ITree, element: any): TPromise<any> {
		if (element instanceof ConnectionProfile) {
			return TPromise.as(null);
		} else if (element instanceof ConnectionProfileGroup) {
			return TPromise.as((<ConnectionProfileGroup>element).getChildren());
		} else {
			return TPromise.as(null);
		}
	}

	/**
	 * Returns the element's parent in a promise.
	 */
	public getParent(tree: ITree, element: any): TPromise<any> {
		if (element instanceof ConnectionProfile) {
			return TPromise.as((<ConnectionProfile>element).getParent());
		}
		else if (element instanceof ConnectionProfileGroup) {
			return TPromise.as((<ConnectionProfileGroup>element).getParent());
		} else {
			return TPromise.as(null);
		}
	}
}

/**
 * Implements drag and drop for the server tree
 */
export class ServerTreeDragAndDrop implements IDragAndDrop {

	constructor( @IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService
	) {
	}

	/**
	 * Returns a uri if the given element should be allowed to drag.
	 * Returns null, otherwise.
	 */
	public getDragURI(tree: ITree, element: any): string {
		if (element instanceof ConnectionProfile) {
			return (<ConnectionProfile>element).id;
		}
		else if (element instanceof ConnectionProfileGroup) {
			return (<ConnectionProfileGroup>element).id;
		}
		return null;
	}

	/**
	 * Returns a label(name) to display when dragging the element.
	 */
	public getDragLabel(tree: ITree, elements: any[]): string {
		if (elements[0] instanceof ConnectionProfile) {
			return (<ConnectionProfile>elements[0]).serverName;
		} else if (elements[0] instanceof ConnectionProfileGroup) {
			return (<ConnectionProfileGroup>elements[0]).name;
		} else {
			return undefined;
		}
	}

	/**
	 * Called when the drag operation starts.
	 */
	public onDragStart(tree: ITree, data: IDragAndDropData, originalEvent: DragMouseEvent): void {
		return;
	}

	/**
	 * Returns a DragOverReaction indicating whether sources can be
	 * dropped into target or some parent of the target.
	 * Returns DRAG_OVER_ACCEPT_BUBBLE_DOWN when element is a connection group or connection
	 */
	public onDragOver(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): IDragOverReaction {
		if (targetElement instanceof ConnectionProfile || targetElement instanceof ConnectionProfileGroup) {
			return DRAG_OVER_ACCEPT_BUBBLE_DOWN(true);
		}
		return DRAG_OVER_REJECT;
	}

	/**
	 * Handle a drop in the server tree.
	 */
	public drop(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): void {
		let targetConnectionProfileGroup: ConnectionProfileGroup;
		if (targetElement instanceof ConnectionProfile) {
			targetConnectionProfileGroup = (<ConnectionProfile>targetElement).getParent();
		}
		else {
			targetConnectionProfileGroup = <ConnectionProfileGroup>targetElement;
		}
		const source = data.getData()[0];
		let oldParent: ConnectionProfileGroup = source.getParent();

		if (this.isDropAllowed(targetConnectionProfileGroup, oldParent, source)) {

			if (source instanceof ConnectionProfile) {
				// Change group id of profile
				this.connectionManagementService.changeGroupIdForConnection(source, targetConnectionProfileGroup.id).then(() => {
					this.renderTree(tree);
				});
			} else if (source instanceof ConnectionProfileGroup) {
				// Change parent id of group
				this.connectionManagementService.changeGroupIdForConnectionGroup(source, targetConnectionProfileGroup).then(() => {
					this.renderTree(tree);
				});
			}
		}
		return;
	}

	private isDropAllowed(targetConnectionProfileGroup: ConnectionProfileGroup,
		oldParent: ConnectionProfileGroup,
		source: ConnectionProfile | ConnectionProfileGroup): boolean {

		let isDropToItself = source && targetConnectionProfileGroup && (source instanceof ConnectionProfileGroup) && source.name === targetConnectionProfileGroup.name;
		let isDropToSameLevel = oldParent && oldParent.equals(targetConnectionProfileGroup);
		return (targetConnectionProfileGroup && targetConnectionProfileGroup.name !== 'root' && !isDropToSameLevel && !isDropToItself);
	}

	/**
	 * Sets tree input and renders tree
	 */
	public renderTree(tree: ITree): void {
		let treeInput = new ConnectionProfileGroup('root', null, 'root');
		let groups = this.connectionManagementService.getConnectionGroups();
		treeInput.addGroups(groups);
		if (treeInput !== tree.getInput()) {
			tree.setInput(treeInput).done(() => {
				tree.getFocus();
			}, errors.onUnexpectedError);
		} else {
			tree.refresh().done(() => {
				tree.getFocus();
			}, errors.onUnexpectedError);
		}

	}
}
