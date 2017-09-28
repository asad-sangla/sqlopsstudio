/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/parts/accountManagement/common/media/accountListRenderer';
import 'vs/css!sql/parts/accountManagement/common/media/accountActions';
import 'vs/css!sql/parts/accountManagement/common/media/common-icons';
import 'vs/css!sql/media/icons/common-icons';
import * as DOM from 'vs/base/browser/dom';
import { IDelegate, IRenderer } from 'vs/base/browser/ui/list/list';
import { ActionBar, IActionOptions } from 'vs/base/browser/ui/actionbar/actionbar';
import { localize } from 'vs/nls';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';

import { RemoveAccountAction, ApplyFilterAction, RefreshAccountAction } from 'sql/parts/accountManagement/common/accountActions';

import * as data from 'data';

export class AccountListDelegate implements IDelegate<data.Account> {

	constructor(
		private _height: number,
		private _id: string
	) {
	}

	public getHeight(element: data.Account): number {
		return this._height;
	}

	public getTemplateId(element: data.Account): string {
		return this._id;
	}
}

export interface AccountListTemplate {
	icon: HTMLElement;
	badgeContent: HTMLElement;
	contextualDisplayName: HTMLElement;
	displayName: HTMLElement;
	content?: HTMLElement;
	actions?: ActionBar;
}

export class AccountListRenderer implements IRenderer<data.Account, AccountListTemplate> {
	public static ACCOUNT_PICKER_TEMPLATE_ID = 'accountPicker';
	public static ACCOUNT_MANAGEMENT_TEMPLATE_ID = 'accountManagement';
	constructor(
		private _templateId: string,
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	public get templateId(): string {
		return this._templateId;
	}

	public renderTemplate(container: HTMLElement): AccountListTemplate {
		const tableTemplate: AccountListTemplate = Object.create(null);
		const badge = DOM.$('div.badge');
		const row = DOM.append(container, DOM.$('div.list-row'));
		tableTemplate.icon = DOM.append(row, DOM.$('div.icon'));
		DOM.append(tableTemplate.icon, badge);
		tableTemplate.badgeContent = DOM.append(badge, DOM.$('div.badge-content'));
		const label = DOM.append(row, DOM.$('div.label'));
		tableTemplate.contextualDisplayName = DOM.append(label, DOM.$('div.contextual-display-name'));
		tableTemplate.displayName = DOM.append(label, DOM.$('div.display-name'));

		if (this._templateId === AccountListRenderer.ACCOUNT_MANAGEMENT_TEMPLATE_ID) {
			tableTemplate.content = DOM.append(label, DOM.$('div.content'));
			tableTemplate.actions = new ActionBar(row, { animated: false });
		}

		return tableTemplate;
	}

	renderElement(account: data.Account, index: number, templateData: AccountListTemplate): void {
		let iconClass = 'icon ' + account.displayInfo.accountType;
		templateData.icon.className = iconClass;
		templateData.contextualDisplayName.innerText = account.displayInfo.contextualDisplayName;
		templateData.displayName.innerText = account.displayInfo.displayName;
		if (account.isStale) {
			templateData.badgeContent.className = 'badge-content icon warning-badge';
		} else {
			templateData.badgeContent.className = 'badge-content';
		}

		if (this._templateId === AccountListRenderer.ACCOUNT_MANAGEMENT_TEMPLATE_ID) {
			if (account.isStale) {
				templateData.content.innerText = localize('refreshCredentials', 'You need to refresh the credentials for this account.');
			} else {
				templateData.content.innerText = '';
			}
			templateData.actions.clear();

			let actionOptions: IActionOptions = { icon: true, label: false };
			if (account.isStale) {
				templateData.actions.push(new RefreshAccountAction(RefreshAccountAction.ID, RefreshAccountAction.LABEL), actionOptions);
			} else {
				templateData.actions.push(new ApplyFilterAction(ApplyFilterAction.ID, ApplyFilterAction.LABEL), actionOptions);
			}
			let removeAction = this._instantiationService.createInstance(RemoveAccountAction, RemoveAccountAction.ID, RemoveAccountAction.LABEL, account.displayInfo.displayName);
			templateData.actions.push(removeAction, actionOptions);
		}
	}

	disposeTemplate(template: AccountListTemplate): void {
		// noop
	}
}