/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import dom = require('vs/base/browser/dom');
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import { ITree, IRenderer } from 'vs/base/parts/tree/browser/tree';
import { IObjectExplorerTemplateData } from 'sql/parts/objectExplorer/viewlet/templateData';
const $ = dom.$;

/**
 * Renders the tree items.
 * Uses the dom template to render object explorer.
 */
export class ObjectExplorerRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 28;
	private static CONNECTION_TEMPLATE_ID = 'objectExplorer';

	/**
	 * Returns the element's height in the tree, in pixels.
	 */
	public getHeight(tree: ITree, element: any): number {
		return ObjectExplorerRenderer.CONNECTION_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		return ObjectExplorerRenderer.CONNECTION_TEMPLATE_ID;
	}

	/**
	 * Render template in a dom element based on template id
	 */
	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		if (templateId === ObjectExplorerRenderer.CONNECTION_TEMPLATE_ID) {
			const objectExplorerTemplate: IObjectExplorerTemplateData = Object.create(null);
			objectExplorerTemplate.root = dom.append(container, $('.object-element-group'));
			objectExplorerTemplate.icon = dom.append(objectExplorerTemplate.root, $('img.object-icon'));
			objectExplorerTemplate.label = dom.append(objectExplorerTemplate.root, $('div.label'));

			return objectExplorerTemplate;
		}

	}

	/**
	 * Render a element, given an object bag returned by the template
	 */
	public renderElement(tree: ITree, element: any, templateId: string, templateData: any): void {
		if (templateId === ObjectExplorerRenderer.CONNECTION_TEMPLATE_ID) {
			this.renderConnection(tree, element, templateData);
		}
	}

	private renderConnection(tree: ITree, treeNode: TreeNode, templateData: IObjectExplorerTemplateData): void {
		var iconFilePath = require.toUrl('sql/media/objectTypes/' + treeNode.nodeTypeId + '.svg');
		templateData.icon.style.content = 'url(' + iconFilePath + ')';
		templateData.label.textContent = treeNode.label;
	}

	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		//TODO
	}
}

