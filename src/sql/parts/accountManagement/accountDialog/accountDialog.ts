/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/accountDialog';
import 'vs/css!./media/accountActions';
import 'vs/css!sql/media/icons/common-icons';
import { $ } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IListService } from 'vs/platform/list/browser/listService';
import { IDelegate, IRenderer } from 'vs/base/browser/ui/list/list';
import { Button } from 'vs/base/browser/ui/button/button';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { localize } from 'vs/nls';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachListStyler, attachButtonStyler } from 'vs/platform/theme/common/styler';
import { IAction, ActionRunner } from 'vs/base/common/actions';
import { ActionBar, IActionOptions } from 'vs/base/browser/ui/actionbar/actionbar';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';

import { Modal } from 'sql/parts/common/modal/modal';
import { AccountViewModel, ProviderAccountParam } from 'sql/parts/accountManagement/accountDialog/accountViewModel';
import { FixedListView } from 'sql/parts/accountManagement/accountDialog/fixedListView';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { AddLinkedAccountAction, RemoveAccountAction, ApplyFilterAction, RefreshAccountAction } from 'sql/parts/accountManagement/accountDialog/accountActions';

import * as data from 'data';

class AccountListDelegate implements IDelegate<data.Account> {
	getHeight = () => 77;

	getTemplateId(element: data.Account) {
		return 'accountResource';
	}
}

interface TableTemplate {
	icon: HTMLElement;
	badgeContent: HTMLElement;
	contextualDisplayName: HTMLElement;
	displayName: HTMLElement;
	content: HTMLElement;
	actions: ActionBar;
}

class AccountRenderer implements IRenderer<data.Account, TableTemplate> {
	static TEMPLATE_ID = 'accountResource';
	get templateId(): string { return AccountRenderer.TEMPLATE_ID; }

	constructor(
		@IInstantiationService private _instantiationService: IInstantiationService
	) {
	}

	renderTemplate(container: HTMLElement): TableTemplate {
		const tableTemplate: TableTemplate = Object.create(null);
		const badge = DOM.$('div.badge');
		const row = DOM.append(container, DOM.$('div.list-row'));
		tableTemplate.icon = DOM.append(row, DOM.$('div.icon'));
		DOM.append(tableTemplate.icon, badge);
		tableTemplate.badgeContent = DOM.append(badge, DOM.$('div.badge-content'));
		const label = DOM.append(row, DOM.$('div.label'));
		tableTemplate.contextualDisplayName = DOM.append(label, DOM.$('div.contextual-display-name'));
		tableTemplate.displayName = DOM.append(label, DOM.$('div.display-name'));
		tableTemplate.content = DOM.append(label, DOM.$('div.content'));
		tableTemplate.actions = new ActionBar(row, { animated: false });
		return tableTemplate;
	}

	renderElement(account: data.Account, index: number, templateData: TableTemplate): void {
		let iconClass = 'icon ' + account.displayInfo.accountType;
		templateData.icon.className = iconClass;
		templateData.contextualDisplayName.innerText = account.displayInfo.contextualDisplayName;
		templateData.displayName.innerText = account.displayInfo.displayName;
		if (account.isStale) {
			templateData.badgeContent.className = 'badge-content icon warning';
			templateData.content.innerText = localize('refreshCredentials', 'You need to refresh the credentials for this account.');
		} else {
			templateData.badgeContent.className = 'badge-content';
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

	disposeTemplate(template: TableTemplate): void {
		// noop
	}
}

export class AccountDialog extends Modal {
	public viewModel: AccountViewModel;
	private _closeButton: Button;
	private _delegate: AccountListDelegate;
	private _accountRenderer: AccountRenderer;
	private _actionRunner: ActionRunner;
	private _accountListViewMap: { [providerId: string]: FixedListView } = {};

	private _addAccountAction: IAction;
	private _splitView: SplitView;
	private _container: HTMLElement;

	private _onCloseEvent = new Emitter<void>();
	public onCloseEvent: Event<void> = this._onCloseEvent.event;

	constructor(
		@IPartService partService: IPartService,
		@IThemeService private _themeService: IThemeService,
		@IListService private _listService: IListService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextMenuService private _contextMenuService: IContextMenuService,
		@IKeybindingService private _keybindingService: IKeybindingService,
	) {
		super(localize('linkedAccounts', 'Linked Accounts'), partService);

		this._delegate = new AccountListDelegate();
		this._accountRenderer = this._instantiationService.createInstance(AccountRenderer);
		this._actionRunner = new ActionRunner();

		// view model
		this.viewModel = this._instantiationService.createInstance(AccountViewModel);
		this.viewModel.onUpdateProviderAccounts((providerAccountParam) => this.updateProviverAccountsList(providerAccountParam));

		this._addAccountAction = this._instantiationService.createInstance(AddLinkedAccountAction,
			AddLinkedAccountAction.ID,
			AddLinkedAccountAction.LABEL);
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);
		this._closeButton = this.addFooterButton(localize('close', 'Close'), () => this.close());
		this.registerListeners();
	}

	protected renderBody(container: HTMLElement) {
		this._container = container;
		let viewBody = DOM.$('div.account-view');
		DOM.append(container, viewBody);
		this._splitView = new SplitView(viewBody);
	}

	public showError(errorMessage: string): void {
		this.setError(errorMessage);
	}

	public hideError() {
		this.setError('');
	}

	private registerListeners(): void {
		// Theme styler
		this._register(attachButtonStyler(this._closeButton, this._themeService));
	}

	/* Overwrite esapce key behavior */
	protected onClose() {
		this.close();
	}

	/* Overwrite enter key behavior */
	protected onAccept() {
		this.close();
	}

	public close() {
		this._onCloseEvent.fire();
		this.hide();
	}

	public open() {
		this.show();
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	public dispose(): void {
		super.dispose();
		for (var key in this._accountListViewMap) {
			this._accountListViewMap[key].dispose();
			delete this._accountListViewMap[key];
		}
	}

	private updateProviverAccountsList(providerAccountParam: ProviderAccountParam): void {
		let accountListView = this._accountListViewMap[providerAccountParam.providerId];
		if (!accountListView) {
			let providerView = $().div({ 'class': 'provider-view' });
			let accountList = new List<data.Account>(providerView.getHTMLElement(), this._delegate, [this._accountRenderer]);
			accountListView = new FixedListView(providerAccountParam.providerDisplayName, accountList, providerView.getHTMLElement(), false, 22, [this._addAccountAction], this._actionRunner, this._contextMenuService, this._keybindingService, this._themeService);
			this._splitView.addView(accountListView);
			this._register(attachListStyler(accountList, this._themeService));
			this._register(this._listService.register(accountList));
			this._accountListViewMap[providerAccountParam.providerId] = accountListView;
		}
		accountListView.updateList(providerAccountParam.accounts);
		this._splitView.layout(DOM.getContentHeight(this._container));
	}
}