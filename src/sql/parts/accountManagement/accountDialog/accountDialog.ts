/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'vs/css!sql/media/bootstrap';
import 'vs/css!sql/media/bootstrap-theme';
import 'vs/css!./media/accountDialog';
import 'vs/css!sql/parts/accountManagement/common/media/accountActions';
import { $ } from 'vs/base/browser/builder';
import * as DOM from 'vs/base/browser/dom';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { List } from 'vs/base/browser/ui/list/listWidget';
import { IListService } from 'vs/platform/list/browser/listService';
import { Button } from 'vs/base/browser/ui/button/button';
import { IPartService } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { localize } from 'vs/nls';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachListStyler, attachButtonStyler } from 'vs/platform/theme/common/styler';
import { IAction, ActionRunner } from 'vs/base/common/actions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

import { Modal } from 'sql/parts/common/modal/modal';
import { AccountViewModel, ProviderAccountParam } from 'sql/parts/accountManagement/accountDialog/accountViewModel';
import { FixedListView } from 'sql/parts/accountManagement/accountDialog/fixedListView';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { AddLinkedAccountAction } from 'sql/parts/accountManagement/common/accountActions';
import { AccountListRenderer, AccountListDelegate } from 'sql/parts/accountManagement/common/accountListRenderer';

import * as data from 'data';

export class AccountDialog extends Modal {
	public static ACCOUNTLIST_HEIGHT = 77;

	public viewModel: AccountViewModel;
	private _closeButton: Button;
	private _delegate: AccountListDelegate;
	private _accountRenderer: AccountListRenderer;
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
		@ITelemetryService telemetryService: ITelemetryService
	) {
		super(localize('linkedAccounts', 'Linked Accounts'), TelemetryKeys.Accounts, partService, telemetryService);

		this._delegate = new AccountListDelegate(AccountDialog.ACCOUNTLIST_HEIGHT);
		this._accountRenderer = this._instantiationService.createInstance(AccountListRenderer);
		this._actionRunner = new ActionRunner();

		// view model
		this.viewModel = this._instantiationService.createInstance(AccountViewModel);
		this.viewModel.onUpdateProviderAccounts((providerAccountParam) => this.updateProviderAccountsList(providerAccountParam));

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
	}

	protected layout(height?: number): void {
		// Ignore height as it's a subcomponent being laid out
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	public dispose(): void {
		super.dispose();
		for (var key in this._accountListViewMap) {
			this._accountListViewMap[key].dispose();
			delete this._accountListViewMap[key];
		}
	}

	private updateProviderAccountsList(providerAccountParam: ProviderAccountParam): void {
		let accountListView = this._accountListViewMap[providerAccountParam.providerId];
		if (!accountListView) {
			let providerView = $().div({ 'class': 'provider-view' });
			let accountList = new List<data.Account>(providerView.getHTMLElement(), this._delegate, [this._accountRenderer]);
			accountListView = new FixedListView(undefined, providerAccountParam.providerDisplayName, accountList, providerView.getHTMLElement(), false, 22, [this._addAccountAction], this._actionRunner, this._contextMenuService, this._keybindingService, this._themeService);
			this._splitView.addView(accountListView);
			this._register(attachListStyler(accountList, this._themeService));
			this._register(this._listService.register(accountList));
			this._accountListViewMap[providerAccountParam.providerId] = accountListView;
		}
		accountListView.updateList(providerAccountParam.accounts);
		this.layout();
	}
}