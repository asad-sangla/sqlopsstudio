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

import * as data from 'data';
import { DropdownList } from 'sql/base/browser/ui/dropdownList/dropdownList';
import { attachDropdownStyler } from 'sql/common/theme/styler';
import { AddAccountAction, RefreshAccountAction } from 'sql/parts/accountManagement/common/accountActions';
import { AccountPickerListRenderer, AccountListDelegate } from 'sql/parts/accountManagement/common/accountListRenderer';
import { AccountPickerViewModel } from 'sql/parts/accountManagement/accountPicker/accountPickerViewModel';

export class AccountPicker extends Disposable {
	public static ACCOUNTPICKERLIST_HEIGHT = 47;
	private _viewModel: AccountPickerViewModel;
	private _accountList: List<data.Account>;
	private _refreshContainer: HTMLElement;
	private _listContainer: HTMLElement;

	constructor(
		private _providerId: string,
		@IWorkbenchThemeService private _themeService: IWorkbenchThemeService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IContextViewService private _contextViewService: IContextViewService
	) {
		super();
		let self = this;

		// Create an account list
		let delegate = new AccountListDelegate(AccountPicker.ACCOUNTPICKERLIST_HEIGHT);
		let accountRenderer = new AccountPickerListRenderer();
		this._listContainer = DOM.$('div.account-list-container');
		this._accountList = new List<data.Account>(this._listContainer, delegate, [accountRenderer]);
		this._register(attachListStyler(this._accountList, this._themeService));

		// Create the view model, wire up the events, and initialize with baseline data
		this._viewModel = this._instantiationService.createInstance(AccountPickerViewModel, this._providerId);
		this._viewModel.updateAccountListEvent(arg => {
			if (arg.providerId === self._providerId) {
				this.updateAccountList(arg.accountList);
			}
		});
		this._viewModel.initialize()
			.then((accounts: data.Account[]) => {
				self.updateAccountList(accounts);
			});
	}

	/**
	 * Get the selected account
	 */
	public get selectedAccount(): data.Account {
		return this._accountList && this._accountList.length >= 0
			? this._accountList.getSelectedElements()[0]
			: undefined;
	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	/**
	 * Render account picker
	 */
	public render(container: HTMLElement) {
		// Create a dropdown for account picker
		let option: IDropdownOptions = {
			contextViewProvider: this._contextViewService,
			labelRenderer: (container) => this.renderLabel(container)
		};
		let addAccountAction = this._instantiationService.createInstance(AddAccountAction, this._providerId);

		let dropdown = new DropdownList(container, option, this._listContainer, this._accountList, this._themeService, addAccountAction);
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

	public dispose() {
		super.dispose();
		if (this._accountList) {
			this._accountList.dispose();
		}
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private onAccountSelectionChange(account: data.Account) {
		if (account.isStale) {
			new Builder(this._refreshContainer).show();
		} else {
			new Builder(this._refreshContainer).hide();
		}
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

			icon.className = 'icon';
			// Set the account icon
			icon.style.background = `url('data:${account.displayInfo.contextualLogo.light}')`;
			// TODO: Pick between the light and dark logo
			label.innerText = account.displayInfo.displayName + ' (' + account.displayInfo.contextualDisplayName + ')';

			if (account.isStale) {
				badgeContent.className = 'badge-content icon warning-badge';
			} else {
				badgeContent.className = 'badge-content';
			}
		} else {
			const row = DOM.append(container, DOM.$('div.no-account-container'));
			row.innerText = AddAccountAction.LABEL + '...';
		}
		return null;
	}

	private updateAccountList(accounts: data.Account[]): void {
		// Replace the existing list with the new one
		// TODO: keep the selection to the current one
		this._accountList.splice(0, this._accountList.length, accounts);
		this._accountList.setSelection([0]);
		this._accountList.layout(this._accountList.contentHeight);
	}

	/**
	 * Update theming that is specific to account picker
 	 */
	private updateTheme(theme: IColorTheme): void {
		let linkColor = theme.getColor(buttonBackground);
		let link = linkColor ? linkColor.toString() : null;
		this._refreshContainer.style.color = link;
		if (this._refreshContainer) {
			this._refreshContainer.style.color = link;
		}
	}
}