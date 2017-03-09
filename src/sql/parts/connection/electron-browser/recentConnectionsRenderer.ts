/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import dom = require('vs/base/browser/dom');
import { ConnectionProfileGroup } from 'sql/parts/connection/node/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
import { QueryEditorService } from 'sql/parts/editor/queryEditorService';
import { IConnectionProfileGroupTemplateData, IConnectionTemplateData } from 'sql/parts/connection/electron-browser/templateData';
const $ = dom.$;

/**
 * Renders the tree items.
 * Uses the dom template to render connection groups and connections.
 */
export class RecentConnectionsRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 62;
	private static CONNECTION_TEMPLATE_ID = 'connection';
	private static CONNECTION_GROUP_TEMPLATE_ID = 'ConnectionProfileGroup';

	/**
	 * Returns the element's height in the tree, in pixels.
	 */
	public getHeight(tree: ITree, element: any): number {
		return RecentConnectionsRenderer.CONNECTION_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		return RecentConnectionsRenderer.CONNECTION_TEMPLATE_ID;
	}

	/**
	 * Render template in a dom element based on template id
	 */
	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		if (templateId === RecentConnectionsRenderer.CONNECTION_TEMPLATE_ID) {
			const serverTemplate: IConnectionTemplateData = Object.create(null);
			serverTemplate.root = dom.append(container, $('.editor-group'));
			serverTemplate.serverName = dom.append(serverTemplate.root, $('span.name'));
			serverTemplate.databaseName = dom.append(serverTemplate.root, $('.description.ellipsis'));
			serverTemplate.footer = dom.append(serverTemplate.root, $('.footer'));
			serverTemplate.type = dom.append(serverTemplate.footer, $('.author.ellipsis'));
			return serverTemplate;
		}

	}

	/**
	 * Render a element, given an object bag returned by the template
	 */
	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		if (templateId === RecentConnectionsRenderer.CONNECTION_TEMPLATE_ID) {
			this.renderConnection(tree, element, templateData);
		}
	}

	private renderConnection(tree: ITree, connection: ConnectionProfile, templateData: IConnectionTemplateData): void {
		templateData.serverName.textContent = connection.serverName;
		templateData.databaseName.textContent = connection.databaseName;
		templateData.type.textContent = connection.type;
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

/**
 * Implements drag and drop for the server tree
 */
export class RecentConnectionsDragAndDrop implements IDragAndDrop {

	constructor(@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
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
		}
		else if (elements[0] instanceof ConnectionProfileGroup) {
			return (<ConnectionProfileGroup>elements[0]).name;
		}
	}

	/**
	 * Sent when the drag operation is starting.
	 */
	public onDragStart(tree: ITree, data: IDragAndDropData, originalEvent: DragMouseEvent): void {
		console.log('drag start');
		return;
	}

	/**
	 * Returns a DragOverReaction indicating whether sources can be
	 * dropped into target or some parent of the target.
	 * Returns DRAG_OVER_ACCEPT_BUBBLE_DOWN when element is aconnection group or connection
	 */
	public onDragOver(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): IDragOverReaction {
		if (targetElement instanceof ConnectionProfile || targetElement instanceof ConnectionProfileGroup) {
			console.log('drag accept');
			return DRAG_OVER_ACCEPT_BUBBLE_DOWN(true);
		}
		return DRAG_OVER_REJECT;
	}

	/**
	 * Handle drop in the server tree.
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

		if (targetConnectionProfileGroup && targetConnectionProfileGroup.name !== 'root' && oldParent && !oldParent.equals(targetConnectionProfileGroup)) {

			console.log('drop ' + source.serverName + ' to ' + targetConnectionProfileGroup.fullName);
			if (source instanceof ConnectionProfile) {
				// Change groupName of Profile
				this.connectionManagementService.changeGroupNameForConnection(source, targetConnectionProfileGroup.fullName).then(() => {
					this.renderTree(tree);
				});
			} else if (source instanceof ConnectionProfileGroup) {

				// Change groupName of all children under this group
				this.connectionManagementService.changeGroupNameForGroup(source.fullName, targetConnectionProfileGroup.fullName + '/' + source.name).then(() => {
					// Move group to its new parent
					oldParent.removeGroup(source);
					targetConnectionProfileGroup.addGroup(source);
					this.connectionManagementService.updateGroups(this.getTopParent(oldParent), this.getTopParent(targetConnectionProfileGroup)).then(() => {
						this.renderTree(tree);
					});
				});
			}
		}
		return;
	}

	/**
	 * Set tree input and render tree
	 */
	public renderTree(tree: ITree): void {
		let treeInput = new ConnectionProfileGroup('root', null, undefined);
			let groups = this.connectionManagementService.getConnections();
			treeInput.addGroups(groups);
			console.log('tree input');
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

	/**
	 * Returns the topmost parent of a tree item
	 */
	public getTopParent(element: ConnectionProfileGroup): ConnectionProfileGroup {
		let current = element;
		while (current.getParent() !== null && current.getParent().id !== 'root') {
			current = current.getParent();
		}
		return current;
	}
}
