/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import dom = require('vs/base/browser/dom');
import { ConnectionProfileGroup } from '../node/connectionProfileGroup';
import { ConnectionProfile } from '../node/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
import { IQueryEditorService } from 'sql/parts/editor/queryEditorService';
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
			const serverTemplate: IConnectionTemplateData = Object.create(null);
			serverTemplate.root = dom.append(container, $('.editor-group'));
			serverTemplate.serverName = dom.append(serverTemplate.root, $('span.name'));
			serverTemplate.databaseName = dom.append(serverTemplate.root, $('.description.ellipsis'));
			serverTemplate.footer = dom.append(serverTemplate.root, $('.footer'));
			serverTemplate.type = dom.append(serverTemplate.footer, $('.author.ellipsis'));
			return serverTemplate;
		}
		else {
			const serverTemplate: IConnectionProfileGroupTemplateData = Object.create(null);
			serverTemplate.root = dom.append(container, $('.server-group'));
			serverTemplate.name = dom.append(serverTemplate.root, $('span.name'));
			return serverTemplate;
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
		templateData.type.textContent = connection.type;
	}

	private renderConnectionProfileGroup(tree: ITree, ConnectionProfileGroup: ConnectionProfileGroup, templateData: IConnectionProfileGroupTemplateData): void {
		templateData.name.textContent = ConnectionProfileGroup.name;
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

interface IConnectionTemplateData {
	root: HTMLElement;
	serverName: HTMLSpanElement;
	type: HTMLElement;
	footer: HTMLElement;
	databaseName: HTMLElement;
	icon: HTMLElement;
	details: HTMLElement;
	header: HTMLElement;
	headerContainer: HTMLElement;
}

interface IConnectionProfileGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
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
		}
		else if (element instanceof ConnectionProfileGroup) {
			return (<ConnectionProfileGroup>element).id;
		}
	}

	/**
	 * Returns a boolean value indicating whether the element has children.
	 */
	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof ConnectionProfile) {
			return false;
		}
		else if (element instanceof ConnectionProfileGroup) {
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
		}
		else if (element instanceof ConnectionProfileGroup) {
			return TPromise.as((<ConnectionProfileGroup>element).getChildren());
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
		}
	}
}

/**
 * Implements drag and drop for the server tree
 */
export class ServerTreeDragAndDrop implements IDragAndDrop {

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
		var targetConnectionProfileGroup: ConnectionProfileGroup;
		if (targetElement instanceof ConnectionProfile) {
			targetConnectionProfileGroup = (<ConnectionProfile>targetElement).getParent();
		}
		else {
			targetConnectionProfileGroup = <ConnectionProfileGroup>targetElement;
		}
		const source = data.getData()[0];
		var oldParent: ConnectionProfileGroup = source.getParent();

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
		var treeInput = new ConnectionProfileGroup('root', null);
			var groups = this.connectionManagementService.getConnections();
			treeInput.addGroups(groups);
			console.log('tree input');
			if (treeInput !== tree.getInput()) {
				tree.setInput(treeInput).done(() => {
					tree.getFocus();
					//tree.expand(targetConnectionProfileGroup).done((res) => {
					//	console.log('res' + res);
					//);
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
		var current = element;
		while (current.getParent() !== null && current.getParent().id !== 'root') {
			current = current.getParent();
		}
		return current;
	}
}

/**
 * Actions to add a server to the group
 */
export class AddServerToGroupAction extends Action {
	public static ID = 'registeredServers.addConnection';
	public static LABEL = nls.localize('addConnection', "Add Connection");
	constructor(
		id: string,
		label: string
	) {
		super(id, label);
	}

	public run(element: ConnectionProfileGroup): TPromise<boolean> {
		console.log('Action run');
		return TPromise.as(true);
	}
}

export class NewQueryAction extends Action {
	public static ID = 'registeredServers.newQuery';
	public static LABEL = nls.localize('newQuery', 'New Query');

	constructor(
		id: string,
		label: string,
		@IQueryEditorService private queryEditorService: IQueryEditorService
	) {
		super(id, label);
	}

	public run(element: ConnectionProfile): TPromise<boolean> {
		// ask sqldoc service for an untitled sql sqldoc
		this.queryEditorService.newSqlEditor().then((newDocUri) => {
			// TODO: implement the following components when serverTree is done
			// get connection info from server
			// add a connection to sql doc association to the connection service
		});
		return TPromise.as(true);
	}
}
