/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/connectionViewlet';
import { ThrottledDelayer } from 'vs/base/common/async';
import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet } from 'vs/workbench/browser/viewlet';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { IAction } from 'vs/base/common/actions';
import { addStandardDisposableListener, toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { attachInputBoxStyler } from 'vs/platform/theme/common/styler';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { IConnectionsViewlet, IConnectionManagementService, VIEWLET_ID } from 'sql/parts/connection/common/connectionManagement';
import { ServerTreeView } from 'sql/parts/registeredServer/viewlet/serverTreeView';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { KeyCode } from 'vs/base/common/keyCodes';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { ClearSearchAction, AddServerAction, AddServerGroupAction, ActiveConnectionsFilterAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';

export class ConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private _searchDelayer: ThrottledDelayer<any>;
	private _root: HTMLElement;
	private _searchBox: InputBox;
	private _toDisposeViewlet: IDisposable[] = [];
	private _serverTreeView: ServerTreeView;
	private _viewletContainer: Builder;
	private _searchBoxContainer: Builder;
	private _clearSearchAction: ClearSearchAction;
	private _addServerAction: IAction;
	private _addServerGroupAction: IAction;
	private _activeConnectionsFilterAction: ActiveConnectionsFilterAction;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService private _themeService: IThemeService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService,
		@IMessageService private messageService: IMessageService
	) {
		super(VIEWLET_ID, telemetryService, _themeService);
		this._searchDelayer = new ThrottledDelayer(500);

		this._clearSearchAction = this._instantiationService.createInstance(ClearSearchAction, ClearSearchAction.ID, ClearSearchAction.LABEL, this);
		this._addServerAction = this._instantiationService.createInstance(AddServerAction,
			AddServerAction.ID,
			AddServerAction.LABEL);
		this._addServerGroupAction = this._instantiationService.createInstance(AddServerGroupAction,
			AddServerGroupAction.ID,
			AddServerGroupAction.LABEL);
		this._serverTreeView = this._instantiationService.createInstance(ServerTreeView);
		this._activeConnectionsFilterAction = this._serverTreeView.activeConnectionsFilterAction;
	}

	private onError(err: any): void {
		if (isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}

	public create(parent: Builder): TPromise<void> {
		super.create(parent);
		this._root = parent.getHTMLElement();
		parent.div({ class: 'server-explorer-viewlet' }, (viewletContainer) => {
			this._viewletContainer = viewletContainer;
			viewletContainer.div({ class: 'search-box' }, (searchBoxContainer) => {
				this._searchBoxContainer = searchBoxContainer;
				this._searchBox = new InputBox(
					searchBoxContainer.getHTMLElement(),
					null,
					{
						placeholder: 'Search server names',
						actions: [this._clearSearchAction]
					}
				);

				this._toDisposeViewlet.push(addStandardDisposableListener(this._searchBox.inputElement, 'keydown', (e: IKeyboardEvent) => {
					const isEscape = e.equals(KeyCode.Escape);
					const isEnter = e.equals(KeyCode.Enter);
					if (isEscape || isEnter) {
						e.preventDefault();
						e.stopPropagation();
						if (isEnter) {
							this.search(this._searchBox.value);
						}
					}
				}));

				// Theme styler
				this._toDisposeViewlet.push(attachInputBoxStyler(this._searchBox, this._themeService));

			});
			viewletContainer.div({ Class: 'object-explorer-view' }, (viewContainer) => {
				this._serverTreeView.renderBody(viewContainer.getHTMLElement());
			});
		});
		return TPromise.as(null);
	}

	public search(value: string): void {
		if (value) {
			this._clearSearchAction.enabled = true;
			this._serverTreeView.searchTree(value);
		} else {
			this.clearSearch();
		}
	}

	public setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			this._serverTreeView.setVisible(visible);
		});
	}

	/**
	 * Return actions for the viewlet
	 */
	public getActions(): IAction[] {
		return [this._addServerAction, this._addServerGroupAction, this._activeConnectionsFilterAction];
	}

	public focus(): void {
		super.focus();
	}

	public layout({ height, width }: Dimension): void {
		this._searchBox.layout();
		this._serverTreeView.layout(height - 36); // account for search box
		toggleClass(this._root, 'narrow', width <= 350);
	}

	public getOptimalWidth(): number {
		return 400;
	}

	public clearSearch() {
		this._serverTreeView.refreshTree();
		this._searchBox.value = '';
		this._clearSearchAction.enabled = false;
	}

	public dispose(): void {
		this._serverTreeView.dispose();
		this._toDisposeViewlet = dispose(this._toDisposeViewlet);
	}

}
