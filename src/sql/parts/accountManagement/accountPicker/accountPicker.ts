/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!./media/accountPicker';
import { Builder } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IDropdownOptions } from 'vs/base/browser/ui/dropdown/dropdown';
import { IListEvent } from 'vs/base/browser/ui/list/list';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { buttonBackground } from 'vs/platform/theme/common/colorRegistry';
import { IWorkbenchThemeService, IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import { attachListStyler } from 'vs/platform/theme/common/styler';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { Disposable, IDisposable } from 'vs/base/common/lifecycle';
import { ActionBar } from 'vs/base/browser/ui/actionbar/actionbar';

import { Dropdown } from 'sql/base/browser/ui/dropdown/dropdown';
import { attachDropdownStyler } from 'sql/common/theme/styler';
import { AddLinkedAccountAction, RefreshAccountAction } from 'sql/parts/accountManagement/common/accountActions';
import { AccountListRenderer, AccountListDelegate } from 'sql/parts/accountManagement/common/accountListRenderer';
import { AccountPickerViewModel } from 'sql/parts/accountManagement/accountPicker/accountPickerViewModel';

import * as data from 'data';

export class AccountPicker extends Disposable {
	private _viewModel: AccountPickerViewModel;
	private _accountList: List<data.Account>;
	private _refreshContainer: HTMLElement;
	private _listContainer: HTMLElement;

	constructor(
		@IWorkbenchThemeService private _themeService: IWorkbenchThemeService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super();

		// Create an account list
		let delegate = new AccountListDelegate(47, AccountListRenderer.ACCOUNT_PICKER_TEMPLATE_ID);
		let accountRenderer = this._instantiationService.createInstance(AccountListRenderer, AccountListRenderer.ACCOUNT_PICKER_TEMPLATE_ID);
		this._listContainer = DOM.$('div.account-list-container');
		this._accountList = new List<data.Account>(this._listContainer, delegate, [accountRenderer]);
		this._register(attachListStyler(this._accountList, this._themeService));

		// View model
		this._viewModel = this._instantiationService.createInstance(AccountPickerViewModel);
		this._viewModel.onUpdateProviderAccounts((accounts) => this.updateProviderAccounts(accounts));
		this._viewModel.getAllAzureAccounts();
	}

	/**
	 * Render account picker
	 */
	public render(container: HTMLElement) {
		// Create a dropdown for account picker
		let option: IDropdownOptions = {
			contextViewProvider: this._contextViewService,
			labelRenderer: (container) => this.renderLabel(container)
		};
		let addAccountAction = this._instantiationService.createInstance(AddLinkedAccountAction,
			AddLinkedAccountAction.ID,
			AddLinkedAccountAction.LABEL);

		let dropdown = new Dropdown(container, option, this._listContainer, this._themeService, addAccountAction);
		this._register(attachDropdownStyler(dropdown, this._themeService));
		this._register(this._accountList.onSelectionChange((e: IListEvent<data.Account>) => {
			if (e.elements.length === 1) {
				dropdown.renderLabel();
				this.onAccountSelectionChange(e.elements[0]);
			}
		}));

		// Create refresh account action
		this._refreshContainer = DOM.append(container, DOM.$('div.refresh-container'));
		DOM.append(this._refreshContainer, DOM.$('div.icon warning'));
		let actionBar = new ActionBar(this._refreshContainer, { animated: false });
		actionBar.push(new RefreshAccountAction(RefreshAccountAction.ID, RefreshAccountAction.LABEL), { icon: false, label: true });

		if (this._accountList.length > 0) {
			this._accountList.setSelection([0]);
			this.onAccountSelectionChange(this._accountList.getSelectedElements()[0]);
		} else {
			new Builder(this._refreshContainer).hide();
		}

		let self = this;
		this._register(self._themeService.onDidColorThemeChange(e => self.updateTheme(e)));
		self.updateTheme(self._themeService.getColorTheme());
	}

	// Update theming that is specific to account picker
	private updateTheme(theme: IColorTheme): void {
		let linkColor = theme.getColor(buttonBackground);
		let link = linkColor ? linkColor.toString() : null;
		this._refreshContainer.style.color = link;
		if (this._refreshContainer) {
			this._refreshContainer.style.color = link;
		}
	}

	private onAccountSelectionChange(account: data.Account) {
		if (account.isStale) {
			new Builder(this._refreshContainer).show();
		} else {
			new Builder(this._refreshContainer).hide();
		}
	}

	/**
	 * Get the selected account
	 */
	public get selectedAccount(): data.Account {
		if (this._accountList) {
			if (this._accountList.length > 0) {
				return this._accountList.getSelectedElements()[0];
			}
		}
		return undefined;
	}

	private renderLabel(container: HTMLElement): IDisposable {
		if (container.hasChildNodes()) {
			for (let i = 0; i < container.childNodes.length; i++) {
				container.removeChild(container.childNodes.item(i));
			}
		}

		let selectedAccounts = this._accountList.getSelectedElements();
		let account = selectedAccounts ? selectedAccounts[0] : null;
		if (account) {
			const badge = DOM.$('div.badge');
			const row = DOM.append(container, DOM.$('div.selected-account-container'));
			const icon = DOM.append(row, DOM.$('div.icon'));
			DOM.append(icon, badge);
			const badgeContent = DOM.append(badge, DOM.$('div.badge-content'));
			const label = DOM.append(row, DOM.$('div.label'));

			icon.className = 'icon ' + account.displayInfo.accountType;
			label.innerText = account.displayInfo.displayName + ' (' + account.displayInfo.contextualDisplayName + ')';

			if (account.isStale) {
				badgeContent.className = 'badge-content icon warning-badge';
			} else {
				badgeContent.className = 'badge-content';
			}
		} else {
			const row = DOM.append(container, DOM.$('div.no-account-container'));
			row.innerText = AddLinkedAccountAction.LABEL + '...';
		}
		return null;
	}

	public dispose() {
		super.dispose();
		if (this._accountList) {
			this._accountList.dispose();
		}
	}

	private updateProviderAccounts(accounts: data.Account[]): void {
		this._accountList.splice(0, this._accountList.length, accounts);
		this._accountList.setSelection([0]);
		this._accountList.layout(this._accountList.contentHeight);
	}
}