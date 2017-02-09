/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import dom = require('vs/base/browser/dom');
import { ITree, IDataSource, IRenderer, IDragAndDrop, IDragAndDropData, IDragOverReaction, DRAG_OVER_ACCEPT_BUBBLE_DOWN, DRAG_OVER_REJECT } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import errors = require('vs/base/common/errors');
import { DragMouseEvent } from 'vs/base/browser/mouseEvent';
import { IConnection } from 'sql/parts/connection/common/registeredServers';
const $ = dom.$;

export class ServerTreeRenderer implements IRenderer {

	public static SERVER_HEIGHT = 62;
	public static SERVER_GROUP_HEIGHT = 32;
	private static SERVER_TEMPLATE_ID = 'server';
	private static SERVER_GROUP_TEMPLATE_ID = 'servergroup';

	public getHeight(tree: ITree, element: any): number {
		if (element instanceof ServerGroup) {
			return ServerTreeRenderer.SERVER_GROUP_HEIGHT;
		}
		return ServerTreeRenderer.SERVER_HEIGHT;
	}

	public getTemplateId(tree: ITree, element: any): string {
		if (element instanceof ServerGroup) {
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
			const serverTemplate: IServerGroupTemplateData = Object.create(null);
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
			this.renderServerGroup(tree, element, templateData);
		}
	}

	private renderServer(tree: ITree, server: Server, templateData: IServerTemplateData): void {
		templateData.name.textContent = server.getName();
		templateData.info.textContent = 'server';
		templateData.type.textContent = server.getType();
	}

	private renderServerGroup(tree: ITree, serverGroup: ServerGroup, templateData: IServerGroupTemplateData): void {
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

interface IServerGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
}

export class Server implements IConnection {

	name: string;
	displayName: string;
	parent: ServerGroup = null;

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

	public equals(other: Server): boolean {
		return other.getId() === this.id && other.getName() === this.name;
	}

	public getParent(): ServerGroup {
		return this.parent;
	}
}

export class ServerGroup implements IConnection {

	name: string;
	displayName: string;
	parent: ServerGroup = null;

	constructor(private id: string,
		name: string,
		displayName: string,
		private type: string,
		private children: Server[] | ServerGroup[],
	) {
		this.name = name;
		this.displayName = displayName;
		if (children[0] instanceof Server) {
			if (children !== null) {
				this.children = children as Array<Server>;
				this.children.forEach((ser) => {
					ser.parent = this;
				});
			}
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

	public getChildren(): Server[] | ServerGroup[] {
		return this.children;
	}

	public hasChildren(): boolean {
		if (this.children !== null && this.children.length > 0) {
			return true;
		}
		return false;
	}

	public equals(other: Server): boolean {
		return other.getId() === this.id && other.getName() === this.name;
	}

	public addServerToGroup(child: Server): void {
		var servers = this.children as Array<Server>;
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

	public updateGroup(child: ServerGroup): void {
		var children = this.children as Array<ServerGroup>;
		var index = children.indexOf(child);
		if (index !== -1) {
			this.children[index] = child;
		}
	}

	public removeServerFromGroup(child: Server): void {
		var servers = this.children as Array<Server>;
		servers.forEach((val, i) => {
			if (val.equals(child)) {
				servers.splice(i, 1);
			}
		});
		this.children = servers;
		child.parent = null;
		if (this.children.length === 0) {
			this.children = null;
		}
	}

	public getParent(): ServerGroup {
		return this.parent;
	}
}

export class ServerTreeDataSource implements IDataSource {

	public getId(tree: ITree, element: any): string {
		if (element instanceof Server) {
			return (<Server>element).getId();
		}
		else if (element instanceof ServerGroup) {
			return (<ServerGroup>element).getId();
		}
	}

	public hasChildren(tree: ITree, element: any): boolean {
		if (element instanceof Server) {
			return false;
		}
		else if (element instanceof ServerGroup) {
			return element.getChildren() ? true : false;
		}
		return false;
	}

	public getChildren(tree: ITree, element: any): TPromise<any> {
		if (element instanceof Server) {
			return TPromise.as(null);
		}
		else if (element instanceof ServerGroup) {
			return TPromise.as((<ServerGroup>element).getChildren());
		}
	}

	public getParent(tree: ITree, element: any): TPromise<any> {
		if (element instanceof Server) {
			return TPromise.as((<Server>element).getParent());
		}
		else if (element instanceof ServerGroup) {
			return TPromise.as((<ServerGroup>element).getParent());
		}
	}
}

export class ServerTreeDragAndDrop implements IDragAndDrop {

	public getDragURI(tree: ITree, element: any): string {
		if (element instanceof Server) {
			return (<Server>element).getId();
		}
		else if (element instanceof ServerGroup) {
			return (<ServerGroup>element).getId();
		}
	}

	public getDragLabel(tree: ITree, elements: any[]): string {
		if (elements[0] instanceof Server) {
			return (<Server>elements[0]).getName();
		}
		else if (elements[0] instanceof ServerGroup) {
			return (<ServerGroup>elements[0]).getName();
		}
	}

	public onDragStart(tree: ITree, data: IDragAndDropData, originalEvent: DragMouseEvent): void {
		console.log('drag start');
		return;
	}

	public onDragOver(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): IDragOverReaction {
		if (targetElement instanceof Server || targetElement instanceof ServerGroup) {
			return DRAG_OVER_ACCEPT_BUBBLE_DOWN;
		}
		return DRAG_OVER_REJECT;
	}

	public drop(tree: ITree, data: IDragAndDropData, targetElement: any, originalEvent: DragMouseEvent): void {
		var targetServerGroup;
		if (targetElement instanceof Server) {
			targetServerGroup = (<Server>targetElement).getParent();
		}
		else {
			targetServerGroup = <ServerGroup>targetElement;
		}

		if (targetServerGroup !== null && targetServerGroup.getName() !== 'root') {
			const source: Server = data.getData()[0];
			// let promise: TPromise<void> = TPromise.as(null);
			console.log('drop ' + source.getName() + ' to ' + targetServerGroup.getName());

			var root: ServerGroup = tree.getInput();
			var oldParent = source.getParent();
			oldParent.removeServerFromGroup(source);
			targetServerGroup.addServerToGroup(source);
			root.updateGroup(oldParent);
			root.updateGroup(targetServerGroup);
			const treeInput = new ServerGroup('root', 'root', '', '', root.getChildren());
			if (treeInput !== tree.getInput()) {
				tree.setInput(treeInput).done(() => {
					tree.getFocus();
					tree.expandAll([targetServerGroup, oldParent]);
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