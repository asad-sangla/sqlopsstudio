/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as vscode from 'vscode';
import dom = require('vs/base/browser/dom');
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
const $ = dom.$;

/**
 * Renders the tree items.
 * Uses the dom template to render connection groups and connections.
 */
export class ServerTreeRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 62;
	public static CONNECTION_GROUP_HEIGHT = 32;
	private static CONNECTION_TEMPLATE_ID = 'connection';
	private static CONNECTION_GROUP_TEMPLATE_ID = 'connectiongroup';

	/**
	 * Returns the element's height in the tree, in pixels.
	 */
	public getHeight(tree: ITree, element: any): number {
		if (element instanceof ConnectionGroup) {
			return ServerTreeRenderer.CONNECTION_GROUP_HEIGHT;
		}
		return ServerTreeRenderer.CONNECTION_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		if (element instanceof ConnectionGroup) {
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
			serverTemplate.name = dom.append(serverTemplate.root, $('span.name'));
			serverTemplate.type = dom.append(serverTemplate.root, $('.description.ellipsis'));
			serverTemplate.footer = dom.append(serverTemplate.root, $('.footer'));
			serverTemplate.info = dom.append(serverTemplate.footer, $('.author.ellipsis'));
			return serverTemplate;
		}
		else {
			const serverTemplate: IConnectionGroupTemplateData = Object.create(null);
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
			this.renderConnectionGroup(tree, element, templateData);
		}
	}

	private renderConnection(tree: ITree, connection: ConnectionDisplay, templateData: IConnectionTemplateData): void {
		templateData.name.textContent = connection.getName();
		templateData.info.textContent = 'server';
		templateData.type.textContent = connection.getType();
	}

	private renderConnectionGroup(tree: ITree, connectionGroup: ConnectionGroup, templateData: IConnectionGroupTemplateData): void {
		templateData.name.textContent = connectionGroup.getName();
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

interface IConnectionTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
	type: HTMLElement;
	footer: HTMLElement;
	info: HTMLElement;
	icon: HTMLElement;
	details: HTMLElement;
	header: HTMLElement;
	headerContainer: HTMLElement;
}

interface IConnectionGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
}

/**
 * Class representing a connection to be displayed in the tree
 */
export class ConnectionDisplay implements vscode.ConnectionInfo {

	userName: string;
	password: string;
	parent: ConnectionGroup = null;

	constructor(private id: string,
		public serverName: string,
		public databaseName: string,
		private type: string
	) {

	}

	public getId(): string {
		return this.id;
	}

	public getName(): string {
		return this.serverName;
	}

	public getType(): string {
		return this.type;
	}

	public equals(other: any): boolean {
		if (!(other instanceof ConnectionDisplay)) {
			return false;
		}
		return other.getId() === this.id && other.getName() === this.serverName;
	}

	public getParent(): ConnectionGroup {
		return this.parent;
	}
}

/**
 * Class representing a connection group to be displayed in the tree
 */
export class ConnectionGroup {

	groupName: string;
	parent: ConnectionGroup = null;

	constructor(private id: string,
		groupName: string,
		private type: string,
		private children: [ConnectionDisplay | ConnectionGroup],
	) {
		this.groupName = groupName;
		// assign parent to each child
		if (children !== null) {
			this.children.forEach((connection) => {
				connection.parent = this;
			});
		}
	}

	public getId(): string {
		return this.id;
	}

	public getName(): string {
		return this.groupName;
	}

	public getType(): string {
		return this.type;
	}

	public getChildren(): [ConnectionDisplay | ConnectionGroup] {
		return this.children;
	}

	public hasChildren(): boolean {
		if (this.children !== null && this.children.length > 0) {
			return true;
		}
		return false;
	}

	public equals(other: any): boolean {
		if (!(other instanceof ConnectionGroup)) {
			return false;
		}
		return other.getId() === this.id && other.getName() === this.groupName;
	}

	public addServerToGroup(child: ConnectionDisplay | ConnectionGroup): void {
		var servers = this.children;
		if (this.children === null) {
			this.children = [child];
			child.parent = this;
		}
		else if (!servers.some(x => x.equals(child))) {
			servers.push(child);
			child.parent = this;
			this.children = servers;
		}
	}

	public updateGroup(child: ConnectionGroup): void {
		var index = this.children.indexOf(child);
		if (index !== -1) {
			this.children[index] = child;
		}
	}

	public removeServerFromGroup(child: ConnectionDisplay): void {
		var connections = this.children;
		connections.forEach((val, i) => {
			if (val.equals(child)) {
				connections.splice(i, 1);
			}
		});
		this.children = connections;
		child.parent = null;
		if (this.children.length === 0) {
			this.children = null;
		}
	}

	public getParent(): ConnectionGroup {
		return this.parent;
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
		if (element instanceof ConnectionDisplay) {
			return (<ConnectionDisplay>element).getId();
		}
		else if (element instanceof ConnectionGroup) {
			return (<ConnectionGroup>element).getId();
		}
	}

	/**
	 * Returns a boolean value indicating whether the element has children.
	 */
	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof ConnectionDisplay) {
			return false;
		}
		else if (element instanceof ConnectionGroup) {
			return element.getChildren() ? true : false;
		}
		return false;
	}

	/**
	 * Returns the element's children as an array in a promise.
	 */
	public getChildren(tree: ITree, element: any): TPromise<any> {
		if (element instanceof ConnectionDisplay) {
			return TPromise.as(null);
		}
		else if (element instanceof ConnectionGroup) {
			return TPromise.as((<ConnectionGroup>element).getChildren());
		}
	}

	/**
	 * Returns the element's parent in a promise.
	 */
	public getParent(tree: ITree, element: any): TPromise<any> {
		if (element instanceof ConnectionDisplay) {
			return TPromise.as((<ConnectionDisplay>element).getParent());
		}
		else if (element instanceof ConnectionGroup) {
			return TPromise.as((<ConnectionGroup>element).getParent());
		}
	}
}

/**
 * Implements drag and drop for the server tree
 */
export class ServerTreeDragAndDrop implements IDragAndDrop {

	/**
	 * Returns a uri if the given element should be allowed to drag.
	 * Returns null, otherwise.
	 */
	public getDragURI(tree: ITree, element: any): string {
		if (element instanceof ConnectionDisplay) {
			return (<ConnectionDisplay>element).getId();
		}
		else if (element instanceof ConnectionGroup) {
			return (<ConnectionGroup>element).getId();
		}
		return null;
	}

	/**
	 * Returns a label(name) to display when dragging the element.
	 */
	public getDragLabel(tree: ITree, elements: any[]): string {
		if (elements[0] instanceof ConnectionDisplay) {
			return (<ConnectionDisplay>elements[0]).getName();
		}
		else if (elements[0] instanceof ConnectionGroup) {
			return (<ConnectionGroup>elements[0]).getName();
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
		if (targetElement instanceof ConnectionDisplay || targetElement instanceof ConnectionGroup) {
			return DRAG_OVER_ACCEPT_BUBBLE_DOWN;
		}
		return DRAG_OVER_REJECT;
	}

	/**
	 * Handle drop in the server tree.
	 */
	public drop(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): void {
		var targetConnectionGroup;
		if (targetElement instanceof ConnectionDisplay) {
			targetConnectionGroup = (<ConnectionDisplay>targetElement).getParent();
		}
		else {
			targetConnectionGroup = <ConnectionGroup>targetElement;
		}
		const source: ConnectionDisplay = data.getData()[0];
		var oldParent = source.getParent();

		if (targetConnectionGroup && targetConnectionGroup.getName() !== 'root' && oldParent && !oldParent.equals(targetConnectionGroup)) {

			var treeModel: ServerTreeModel = ServerTreeModel.Instance;
			const treeInput = treeModel.DragAndDrop(source, targetConnectionGroup);
			if (treeInput !== tree.getInput()) {
				tree.setInput(treeInput).done(() => {
					tree.getFocus();
					tree.expand(targetConnectionGroup).done((res) => {
						console.log('res' + res);
					});
				}, errors.onUnexpectedError);
			} else {
				tree.refresh().done(() => {
					tree.getFocus();
				}, errors.onUnexpectedError);
			}
		}
		return;
	}
}

/**
 * Singleton than stores and manipulates the contents of the tree.
 */
export class ServerTreeModel {
	private connectionGroups: [ConnectionGroup] = null;
	private static _instance: ServerTreeModel = undefined;
	private constructor() {
		this.connectionGroups = this.getConnectionGroups();
	}

	public static get Instance(): ServerTreeModel {
		if (this._instance === undefined) {
			this._instance = new ServerTreeModel();
		}
		return this._instance;
	}

	private getConnectionGroups(): [ConnectionGroup] {
		// Stub method to generate input
		var s3 = new ConnectionDisplay('3', 'Server name B', 'Server name B', 'Azure');

		var s5 = new ConnectionDisplay('5', 'Server name D', 'Server name D', 'Azure');
		var s6 = new ConnectionDisplay('6', 'Server name E', 'Server name E', 'OnPrem');
		var s7 = new ConnectionDisplay('7', 'Server name F', 'Server name F', 'OnPrem');
		//var s10 = new ConnectionDisplay('10', 'Server name H', 'Server name F', 'OnPrem');
		//var s9 = new ConnectionGroup('9', 'Server Group I', 'OnPrem' , [s10]);
		var s8 = new ConnectionGroup('8', 'Server Group G', 'OnPrem', [s7]);
		var s2 = new ConnectionGroup('2', 'Server Group A', 'OnPrem', [s3, s8]);
		var s4 = new ConnectionGroup('4', 'Server Group C', 'Azure', [s5, s6]);
		console.log('get data');
		return [s2, s4];
	}

	/**
	 * Removes dragged element from its group and adds it to the target group.
	 */
	public DragAndDrop(source: ConnectionDisplay | ConnectionGroup, targetConnectionGroup: ConnectionGroup): ConnectionGroup {
		var targetElement;
		if (source instanceof ConnectionDisplay) {
			targetElement = <ConnectionDisplay>source;
		}
		else {
			targetElement = <ConnectionGroup>source;
		}
		console.log('drop ' + source.getName() + ' to ' + targetConnectionGroup.getName());
		var oldParent = targetElement.getParent();
		oldParent.removeServerFromGroup(source);
		targetConnectionGroup.addServerToGroup(source);
		this.updateGroup(this.getTopParent(oldParent));
		this.updateGroup(this.getTopParent(targetConnectionGroup));
		return this.getTreeInput();
	}

	/**
	 * Returns current content of the tree
	 */
	public getTreeInput(): ConnectionGroup {
		return new ConnectionGroup('root', 'root', '', this.connectionGroups);
	}

	/**
	 * Returns the topmost parent of a tree item
	 */
	public getTopParent(element: ConnectionGroup): ConnectionGroup {
		var current = element;
		while (current.getParent() !== null && current.getParent().getId() !== 'root') {
			current = current.getParent();
		}
		return current;
	}

	/**
	 * Updates(replaces) an element in the tree
	 */
	public updateGroup(child: ConnectionGroup): void {
		var index = this.connectionGroups.indexOf(child);
		if (index !== -1) {
			this.connectionGroups[index] = child;
		}
	}
}

/**
 * Action to add a server to the group
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

	public run(element: ConnectionGroup): TPromise<boolean> {
		console.log('Action run');
		return TPromise.as(true);
	}
}
