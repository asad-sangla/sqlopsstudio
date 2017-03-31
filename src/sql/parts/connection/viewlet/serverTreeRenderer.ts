/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { append, $ } from 'vs/base/browser/dom';
import { ConnectionProfileGroup } from 'sql/parts/connection/common/connectionProfileGroup';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ITree, IRenderer } from 'vs/base/parts/tree/browser/tree';
import { IConnectionProfileGroupTemplateData, IConnectionTemplateData } from 'sql/parts/connection/viewlet/templateData';
import { ActionBar } from 'vs/base/browser/ui/actionbar/actionbar';
import { ChangeConnectionAction, NewQueryAction } from 'sql/parts/connection/viewlet/connectionTreeAction';

/**
 * Renders the tree items.
 * Uses the dom template to render connection groups and connections.
 */
export class ServerTreeRenderer implements IRenderer {

	public static CONNECTION_HEIGHT = 62;
	public static CONNECTION_GROUP_HEIGHT = 32;
	private static CONNECTION_TEMPLATE_ID = 'connectionProfile';
	private static CONNECTION_GROUP_TEMPLATE_ID = 'connectionProfileGroup';
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
			const root = append(container, $('.editor-group'));
			const serverName = append(root, $('span.name'));
			const databaseName = append(root, $('div.author.ellipsis'));
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
			groupTemplate.root = append(container, $('.server-group'));
			groupTemplate.name = append(groupTemplate.root, $('span.name'));
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

