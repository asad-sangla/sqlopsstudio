/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import dom = require('vs/base/browser/dom');
import { ITree, IDataSource, IRenderer } from 'vs/base/parts/tree/browser/tree';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnection } from 'sql/parts/connection/common/registeredServers';
const $ = dom.$;

export class ServerTreeRenderer implements IRenderer {

	public static ITEM_HEIGHT = 62;
	private static OPEN_EDITOR_TEMPLATE_ID = 'openeditor';

	public getHeight(tree: ITree, element: any): number {
		return ServerTreeRenderer.ITEM_HEIGHT;
	}

	public getTemplateId(tree: ITree, element: any): string {
		return ServerTreeRenderer.OPEN_EDITOR_TEMPLATE_ID;
	}

	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		const serverTemplate: IServerTemplateData = Object.create(null);
		serverTemplate.root = dom.append(container, $('.editor-group'));
		serverTemplate.name = dom.append(serverTemplate.root, $('span.name'));
		serverTemplate.type = dom.append(serverTemplate.root, $('.description.ellipsis'));
		serverTemplate.footer = dom.append(serverTemplate.root, $('.footer'));
		serverTemplate.info = dom.append(serverTemplate.footer, $('.author.ellipsis'));

		return serverTemplate;
	}

	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		this.renderServer(tree, element, templateData);
	}

	private renderServer(tree: ITree, server: Server, templateData: IServerTemplateData): void {
		templateData.name.textContent = server.getName();
		templateData.info.textContent = 'server';
		templateData.type.textContent = server.getType();
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

interface IEditorGroupTemplateData {
	root: HTMLElement;
	name: HTMLSpanElement;
}

export class Server {

	name: string;
	displayName: string;

	constructor(private id: string,
				name: string,
				displayName: string,
				private type: string,
				private children: Server[])
	{
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

	public getChildren(): Server[] {
		return this.children;
	}
}

export class ServerTreeDataSource implements IDataSource {

	public getId(tree: ITree, element: any): string {
		return (<Server>element).getId();
	}

	public hasChildren(tree: ITree, element: Server): boolean {
		return element.getChildren() ? true : false;
	}

	public getChildren(tree: ITree, element: any): TPromise<any> {
		return TPromise.as((<Server>element).getChildren());
	}

	public getParent(tree: ITree, element: any): TPromise<any> {
		return TPromise.as(null);
	}
}
