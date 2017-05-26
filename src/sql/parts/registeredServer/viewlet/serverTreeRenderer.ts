/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { append, $, addDisposableListener, addStandardDisposableListener } from 'vs/base/browser/dom';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ITree, IRenderer } from 'vs/base/parts/tree/browser/tree';
import { IConnectionProfileGroupTemplateData, IConnectionTemplateData, IObjectExplorerTemplateData } from 'sql/parts/registeredServer/viewlet/templateData';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { InputBox, MessageType } from 'vs/base/browser/ui/inputbox/inputBox';
import * as lifecycle from 'vs/base/common/lifecycle';
import { once } from 'vs/base/common/functional';
import { KeyCode } from 'vs/base/common/keyCodes';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { TreeUpdateUtils } from 'sql/parts/registeredServer/viewlet/treeUpdateUtils';
import types = require('vs/base/common/types');
import { attachInputBoxStyler } from 'vs/platform/theme/common/styler';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { TreeNode } from 'sql/parts/registeredServer/common/treeNode';
import dom = require('vs/base/browser/dom');
import * as fs from 'fs';
import uri from 'vs/base/common/uri';

/**
 * Renders the tree items.
 * Uses the dom template to render connection groups and connections.
 */
export class ServerTreeRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 28;
	public static CONNECTION_GROUP_HEIGHT = 38;
	private static CONNECTION_TEMPLATE_ID = 'connectionProfile';
	private static CONNECTION_GROUP_TEMPLATE_ID = 'connectionProfileGroup';
	public static OBJECTEXPLORER_HEIGHT = 28;
	private static OBJECTEXPLORER_TEMPLATE_ID = 'objectExplorer';
	/**
	 * _isCompact is used to render connections tiles with and without the action buttons.
	 * When set to true, like in the connection dialog recent connections tree, the connection
	 * tile is rendered without the action buttons( such as connect, new query).
	 */
	private _isCompact: boolean = false;

	constructor(isCompact: boolean,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextViewService private _contextViewService: IContextViewService,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@IThemeService private _themeService: IThemeService
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
		} else if (element instanceof ConnectionProfile) {
			return ServerTreeRenderer.CONNECTION_HEIGHT;
		}
		return ServerTreeRenderer.OBJECTEXPLORER_HEIGHT;
	}

	/**
	 * Returns a template ID for a given element.
	 */
	public getTemplateId(tree: ITree, element: any): string {
		if (element instanceof ConnectionProfileGroup) {
			return ServerTreeRenderer.CONNECTION_GROUP_TEMPLATE_ID;
		} else if (element instanceof ConnectionProfile) {
			return ServerTreeRenderer.CONNECTION_TEMPLATE_ID;
		}
		return ServerTreeRenderer.OBJECTEXPLORER_TEMPLATE_ID;
	}

	/**
	 * Render template in a dom element based on template id
	 */
	public renderTemplate(tree: ITree, templateId: string, container: HTMLElement): any {

		if (templateId === ServerTreeRenderer.CONNECTION_TEMPLATE_ID) {
			const connectionTemplate: IObjectExplorerTemplateData = Object.create(null);
			connectionTemplate.root = dom.append(container, $('.connection-tile'));
			connectionTemplate.icon = dom.append(connectionTemplate.root, $('img.object-icon'));
			connectionTemplate.label = dom.append(connectionTemplate.root, $('div.label'));
			return connectionTemplate;
		} else if (templateId === ServerTreeRenderer.CONNECTION_GROUP_TEMPLATE_ID) {
			container.classList.add('server-group');
			const groupTemplate: IConnectionProfileGroupTemplateData = Object.create(null);
			groupTemplate.root = append(container, $('.server-group'));
			groupTemplate.name = append(groupTemplate.root, $('span.name'));
			return groupTemplate;
		} else {
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
		if (templateId === ServerTreeRenderer.CONNECTION_TEMPLATE_ID) {
			this.renderConnection(tree, element, templateData);
		} else if (templateId === ServerTreeRenderer.CONNECTION_GROUP_TEMPLATE_ID) {
			this.renderConnectionProfileGroup(tree, element, templateData);
		} else {
			this.renderObjectExplorer(tree, element, templateData);
		}
	}

	private renderObjectExplorer(tree: ITree, treeNode: TreeNode, templateData: IObjectExplorerTemplateData): void {
		var iconName = treeNode.nodeTypeId;
		if (treeNode.nodeStatus) {
			iconName = treeNode.nodeTypeId + '_' + treeNode.nodeStatus;
		}
		if (treeNode.nodeSubType) {
			iconName = treeNode.nodeTypeId + '_' + treeNode.nodeSubType;
		}
		var iconFilePath = require.toUrl('sql/media/objectTypes/' + iconName + '.svg');
		if (!fs.existsSync(uri.parse(iconFilePath).fsPath)) {
			iconFilePath = require.toUrl('sql/media/objectTypes/DefaultIcon.svg');
		}
		templateData.icon.style.content = 'url(' + iconFilePath + ')';
		templateData.label.textContent = treeNode.label;
		templateData.root.title = treeNode.label;
	}


	private renderConnection(tree: ITree, connection: ConnectionProfile, templateData: IConnectionTemplateData): void {
		if (this._connectionManagementService.isConnected(undefined, connection)) {
			templateData.icon.classList.remove('disconnected');
			templateData.icon.classList.add('connected');
		} else {
			templateData.icon.classList.remove('connected');
			templateData.icon.classList.add('disconnected');
		}

		let databaseName = connection.databaseName ? connection.databaseName : '<default>';
		let userName = connection.userName ? connection.userName : 'Windows Auth';
		let label = connection.serverName + ', ' + databaseName + ' (' + userName + ')';

		templateData.label.textContent = label;
		templateData.root.title = label;
		templateData.connectionProfile = connection;
	}

	private renderConnectionProfileGroup(tree: ITree, connectionProfileGroup: ConnectionProfileGroup, templateData: IConnectionProfileGroupTemplateData): void {
		if (connectionProfileGroup.isRenamed) {
			this.renderRenameBox(tree, connectionProfileGroup, templateData);
		} else {
			var rowElement = this.findParentElement(templateData.root, 'monaco-tree-row');
			if (rowElement) {
				if (connectionProfileGroup.color) {
					rowElement.style.background = connectionProfileGroup.color;
				} else {
					// If the group doesn't contain specific color, assign the default color
					rowElement.style.background = '#515151';
				}
			}
			if (connectionProfileGroup.description && (connectionProfileGroup.description !== '')) {
				templateData.root.title = connectionProfileGroup.description;
			}
			templateData.name.hidden = false;
			templateData.name.textContent = connectionProfileGroup.name;
		}
	}

	/**
	 * Returns the first parent which contains the className
	 */
	private findParentElement(container: HTMLElement, className: string): HTMLElement {
		var currentElement = container;
		while (currentElement) {
			if (currentElement.className.includes(className)) {
				break;
			}
			currentElement = currentElement.parentElement;
		}
		return currentElement;
	}

	private renderRenameBox(tree: ITree, connectionProfileGroup: ConnectionProfileGroup, templateData: IConnectionProfileGroupTemplateData): void {
		let inputBoxContainer = append(templateData.root, $('.inputBoxContainer'));
		let inputBox = new InputBox(inputBoxContainer, this._contextViewService, {
			validationOptions: {
				validation: (value: string) => {
					if (value && value.length > 0 && types.isString(value)) {
						return null;
					}
					return { type: MessageType.ERROR, content: 'Invalid input. String value expected.' };
				},
				showMessage: true
			}
		});
		const styler = attachInputBoxStyler(inputBox, this._themeService);
		inputBox.value = connectionProfileGroup.name;
		inputBox.focus();
		inputBox.select();

		let disposed = false;
		const toDispose: [lifecycle.IDisposable] = [inputBox, styler];

		const wrapUp = once((renamed: boolean) => {
			if (!disposed) {
				disposed = true;
				if (renamed && inputBox.value && connectionProfileGroup.name !== inputBox.value) {
					connectionProfileGroup.name = inputBox.value;
					this._connectionManagementService.renameGroup(connectionProfileGroup).then(() => {
						TreeUpdateUtils.registeredServerUpdate(tree, this._connectionManagementService);
					});
				}
				tree.clearHighlight();
				tree.DOMFocus();
				tree.setFocus(connectionProfileGroup);

				// need to remove the input box since this template will be reused.
				templateData.root.removeChild(inputBoxContainer);
				lifecycle.dispose(toDispose);
			}
		});

		toDispose.push(addStandardDisposableListener(inputBox.inputElement, 'keydown', (e: IKeyboardEvent) => {
			const isEscape = e.equals(KeyCode.Escape);
			const isEnter = e.equals(KeyCode.Enter);
			if (isEscape || isEnter) {
				e.preventDefault();
				e.stopPropagation();
				wrapUp(isEnter);
			}
		}));
		toDispose.push(addDisposableListener(inputBox.inputElement, 'blur', () => {
			wrapUp(true);
		}));
	}
	public disposeTemplate(tree: ITree, templateId: string, templateData: any): void {
		// no op
		// InputBox disposed in wrapUp

	}
}

