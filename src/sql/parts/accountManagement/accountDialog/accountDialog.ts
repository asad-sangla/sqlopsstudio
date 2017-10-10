/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/accountDialog';
import 'vs/css!sql/parts/accountManagement/common/media/accountActions';
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
import { ActionRunner } from 'vs/base/common/actions';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import * as TelemetryKeys from 'sql/common/telemetryKeys';

import * as data from 'data';
import { Modal } from 'sql/base/browser/ui/modal/modal';
import { attachModalDialogStyler } from 'sql/common/theme/styler';
import { AccountViewModel } from 'sql/parts/accountManagement/accountDialog/accountViewModel';
import { AddAccountAction } from 'sql/parts/accountManagement/common/accountActions';
import { AccountListRenderer, AccountListDelegate } from 'sql/parts/accountManagement/common/accountListRenderer';
import { AccountProviderAddedEventParams, UpdateAccountListEventParams } from 'sql/services/accountManagement/eventTypes';
import { FixedListView } from 'sql/platform/views/fixedListView';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';

export class AccountDialog extends Modal {
	public static ACCOUNTLIST_HEIGHT = 77;

	public viewModel: AccountViewModel;

	// MEMBER VARIABLES ////////////////////////////////////////////////////
	private _providerViews: { [providerId: string]: FixedListView<data.Account> } = {};

	private _closeButton: Button;
	private _delegate: AccountListDelegate;
	private _accountRenderer: AccountListRenderer;
	private _actionRunner: ActionRunner;
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
		@ITelemetryService telemetryService: ITelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService
	) {
		super(localize('linkedAccounts', 'Linked Accounts'), TelemetryKeys.Accounts, partService, telemetryService, contextKeyService);
		let self = this;

		this._delegate = new AccountListDelegate(AccountDialog.ACCOUNTLIST_HEIGHT);
		this._accountRenderer = this._instantiationService.createInstance(AccountListRenderer);
		this._actionRunner = new ActionRunner();

		// Create the view model and wire up the events
		this.viewModel = this._instantiationService.createInstance(AccountViewModel);
		this.viewModel.addProviderEvent(arg => { self.addProvider(arg); });
		this.viewModel.removeProviderEvent(arg => { self.removeProvider(arg); });
		this.viewModel.updateAccountListEvent(arg => { self.updateProviderAccounts(arg); });
	}

	// MODAL OVERRIDE METHODS //////////////////////////////////////////////
	protected layout(height?: number): void {
		// Ignore height as it's a subcomponent being laid out
		this._splitView.layout(DOM.getContentHeight(this._container));
	}

	public render() {
		let self = this;

		super.render();
		attachModalDialogStyler(this, this._themeService);
		this._closeButton = this.addFooterButton(localize('close', 'Close'), () => this.close());
		this.registerListeners();

		// Load the initial contents of the view model
		this.viewModel.initialize()
			.then(addedProviders => {
				for (let addedProvider of addedProviders) {
					self.addProvider(addedProvider);
				}
			});
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

	/* Overwrite escape key behavior */
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

	public dispose(): void {
		super.dispose();
		for (let key in this._providerViews) {
			this._providerViews[key].dispose();
			delete this._providerViews[key];
		}
	}

	// PRIVATE HELPERS /////////////////////////////////////////////////////
	private addProvider(newProvider: AccountProviderAddedEventParams) {
		// Skip adding the provider if it already exists
		if (this._providerViews[newProvider.addedProvider.id]) {
			return;
		}

		// Account provider doesn't exist, so add it
		// Create a scoped add account action
		let addAccountAction = this._instantiationService.createInstance(
			AddAccountAction,
			newProvider.addedProvider.id
		);

		// Create a fixed list view for the account provider
		let providerViewContainer = DOM.$('.provider-view');
		let accountList = new List<data.Account>(providerViewContainer, this._delegate, [this._accountRenderer]);
		let providerView = new FixedListView<data.Account>(
			undefined,
			false,
			newProvider.addedProvider.displayName,
			accountList,
			providerViewContainer,
			22,
			[addAccountAction],
			this._actionRunner,
			this._contextMenuService,
			this._keybindingService,
			this._themeService
		);

		// Append the list view to the split view
		this._splitView.addView(providerView);
		this._register(attachListStyler(accountList, this._themeService));
		this._register(this._listService.register(accountList));
		this._splitView.layout(DOM.getContentHeight(this._container));

		// Set the initial items of the list
		providerView.updateList(newProvider.initialAccounts);
		this.layout();

		// Store the view for the provider
		this._providerViews[newProvider.addedProvider.id] = providerView;
	}

	private removeProvider(removedProvider: data.AccountProviderMetadata) {
		// Skip removing the provider if it doesn't exist
		let providerView = this._providerViews[removedProvider.id];
		if (!providerView) {
			return;
		}

		// Remove the list view from the split view
		this._splitView.removeView(providerView);
		this._splitView.layout(DOM.getContentHeight(this._container));

		// Remove the list view from our internal map
		delete this._providerViews[removedProvider.id];
		this.layout();
	}

	private updateProviderAccounts(args: UpdateAccountListEventParams) {
		let providerMapping = this._providerViews[args.providerId];
		if (!providerMapping) {
			return;
		}
		providerMapping.updateList(args.accountList);
		this.layout();
	}
}
