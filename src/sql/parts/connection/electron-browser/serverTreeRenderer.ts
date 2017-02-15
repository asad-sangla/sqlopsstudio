/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import dom = require('vs/base/browser/dom');
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { Action } from 'vs/base/common/actions';
import nls = require('vs/nls');
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
import { IConnection } from 'sql/parts/connection/common/connectionManagement';
const $ = dom.$;

export class ServerTreeRenderer implements IRenderer {

	public static SERVER_HEIGHT = 62;
	public static SERVER_GROUP_HEIGHT = 32;
	private static SERVER_TEMPLATE_ID = 'server';
	private static SERVER_GROUP_TEMPLATE_ID = 'servergroup';

	public getHeight(tree: ITree, element: any): number {
		if (element instanceof ConnectionGroup) {
			return ServerTreeRenderer.SERVER_GROUP_HEIGHT;
		}
		return ServerTreeRenderer.SERVER_HEIGHT;
	}

	public getTemplateId(tree: ITree, element: any): string {
		if (element instanceof ConnectionGroup) {
			return ServerTreeRenderer.SERVER_GROUP_TEMPLATE_ID;
		}
		return ServerTreeRenderer.SERVER_TEMPLATE_ID;
	}

	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		if (templateId === ServerTreeRenderer.SERVER_TEMPLATE_ID) {
			const serverTemplate: IServerTemplateData = Object.create(null);
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

	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		if (templateId === ServerTreeRenderer.SERVER_TEMPLATE_ID) {
			this.renderServer(tree, element, templateData);
		}
		else {
			this.renderConnectionGroup(tree, element, templateData);
		}
	}

	private renderServer(tree: ITree, server: Connection, templateData: IServerTemplateData): void {
		templateData.name.textContent = server.getName();
		templateData.info.textContent = 'server';
		templateData.type.textContent = server.getType();
	}

	private renderConnectionGroup(tree: ITree, serverGroup: ConnectionGroup, templateData: IConnectionGroupTemplateData): void {
		templateData.name.textContent = serverGroup.getName();
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

interface IServerTemplateData {
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

export class Connection {

	name: string;
	displayName: string;
	parent: ConnectionGroup = null;

	constructor(private id: string,
		name: string,
		displayName: string,
		private type: string
	) {
		this.name = name;
		this.displayName = displayName;
	}

	public getId(): string {
		return this.id;
	}

	public getName(): string {
		return this.name;
	}

	public getType(): string {
		return this.type;
	}

	public equals(other: any): boolean {
		if (!(other instanceof Connection)) {
			return false;
		}
		return other.getId() === this.id && other.getName() === this.name;
	}

	public getParent(): ConnectionGroup {
		return this.parent;
	}
}

export class ConnectionGroup implements IConnection {

	name: string;
	displayName: string;
	parent: ConnectionGroup = null;

	constructor(private id: string,
		name: string,
		displayName: string,
		private type: string,
		private children: [ Connection | ConnectionGroup ],
	) {
		this.name = name;
		this.displayName = displayName;
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
		return this.name;
	}

	public getType(): string {
		return this.type;
	}

	public getChildren(): [ Connection | ConnectionGroup ]{
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
		return other.getId() === this.id && other.getName() === this.name;
	}

	public addServerToGroup(child: Connection | ConnectionGroup): void {
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
		var children = this.children as Array<ConnectionGroup>;
		var index = children.indexOf(child);
		if (index !== -1) {
			this.children[index] = child;
		}
	}

	public removeServerFromGroup(child: Connection): void {
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

export class ServerTreeDataSource implements IDataSource {

	public getId(tree: ITree, element: any): string {
		if (element instanceof Connection) {
			return (<Connection>element).getId();
		}
		else if (element instanceof ConnectionGroup) {
			return (<ConnectionGroup>element).getId();
		}
	}

	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof Connection) {
			return false;
		}
		else if (element instanceof ConnectionGroup) {
			return element.getChildren() ? true : false;
		}
		return false;
	}

	public getChildren(tree: ITree, element: any): TPromise<any> {
		if (element instanceof Connection) {
			return TPromise.as(null);
		}
		else if (element instanceof ConnectionGroup) {
			return TPromise.as((<ConnectionGroup>element).getChildren());
		}
	}

	public getParent(tree: ITree, element: any): TPromise<any> {
		if (element instanceof Connection) {
			return TPromise.as((<Connection>element).getParent());
		}
		else if (element instanceof ConnectionGroup) {
			return TPromise.as((<ConnectionGroup>element).getParent());
		}
	}
}

export class ServerTreeDragAndDrop implements IDragAndDrop {

	public getDragURI(tree: ITree, element: any): string {
		if (element instanceof Connection) {
			return (<Connection>element).getId();
		}
		else if (element instanceof ConnectionGroup) {
			return (<ConnectionGroup>element).getId();
		}
	}

	public getDragLabel(tree: ITree, elements: any[]): string {
		if (elements[0] instanceof Connection) {
			return (<Connection>elements[0]).getName();
		}
		else if (elements[0] instanceof ConnectionGroup) {
			return (<ConnectionGroup>elements[0]).getName();
		}
	}

	public onDragStart(tree: ITree, data: IDragAndDropData, originalEvent: DragMouseEvent): void {
		console.log('drag start');
		return;
	}

	public onDragOver(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): IDragOverReaction {
		if (targetElement instanceof Connection || targetElement instanceof ConnectionGroup) {
			return DRAG_OVER_ACCEPT_BUBBLE_DOWN;
		}
		return DRAG_OVER_REJECT;
	}

	public drop(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): void {
		var targetConnectionGroup;
		if (targetElement instanceof Connection) {
			targetConnectionGroup = (<Connection>targetElement).getParent();
		}
		else {
			targetConnectionGroup = <ConnectionGroup>targetElement;
		}
		const source: Connection = data.getData()[0];
		var oldParent = source.getParent();
		if (targetConnectionGroup !== null && targetConnectionGroup.getName() !== 'root' && oldParent) {

			// let promise: TPromise<void> = TPromise.as(null);
			console.log('drop ' + source.getName() + ' to ' + targetConnectionGroup.getName());

			var root: ConnectionGroup = tree.getInput();

			oldParent.removeServerFromGroup(source);
			targetConnectionGroup.addServerToGroup(source);
			root.updateGroup(oldParent);
			root.updateGroup(targetConnectionGroup);
			const treeInput = new ConnectionGroup('root', 'root', '', '', root.getChildren());
			if (treeInput !== tree.getInput()) {
				tree.setInput(treeInput).done(() => {
					tree.getFocus();
					tree.expandAll([targetConnectionGroup, oldParent]).done(() => {});
				}, errors.onUnexpectedError);
			} else {
				tree.refresh(root).done(() => {
					tree.getFocus();
				}, errors.onUnexpectedError);
			}
		}
		return;
	}
}

export class AddServerToGroupAction extends Action {
	public static ID = 'registeredServers.addServer';
	public static LABEL = nls.localize('addServer', "Add Connection");
	constructor(
		id: string,
		label: string
	) {
		super(id, label);
	}

	public run(element: ConnectionGroup): TPromise<boolean> {
		console.log('Action run');
		element.addServerToGroup(new Connection('7', 'Connection name F', 'Connection name F', 'OnPrem'));
		return TPromise.as(true);
	}
}
