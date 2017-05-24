/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/connectionViewlet';
import { ThrottledDelayer } from 'vs/base/common/async';
import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet, IViewletView } from 'vs/workbench/browser/viewlet';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { addStandardDisposableListener, toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { IConnectionsViewlet, IConnectionManagementService, VIEWLET_ID } from 'sql/parts/connection/common/connectionManagement';
import { ServerTreeView } from 'sql/parts/registeredServer/viewlet/serverTreeView';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { InputBox } from 'vs/base/browser/ui/inputbox/inputBox';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { KeyCode } from 'vs/base/common/keyCodes';
import { IKeyboardEvent } from 'vs/base/browser/keyboardEvent';
import { ClearSearchAction } from 'sql/parts/registeredServer/viewlet/connectionTreeAction';

export class ConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	private searchBox: InputBox;
	private toDispose: IDisposable[] = [];
	private views: IViewletView[];
	private serverTreeView: ServerTreeView;
	private viewletContainer: Builder;
	private searchBoxContainer: Builder;
	private splitView: SplitView;
	private clearSearchAction: ClearSearchAction;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService,
		@IMessageService private messageService: IMessageService
	) {
		super(VIEWLET_ID, telemetryService, themeService);
		this.searchDelayer = new ThrottledDelayer(500);
		this.views = [];

		this.clearSearchAction = this._instantiationService.createInstance(ClearSearchAction, ClearSearchAction.ID, ClearSearchAction.LABEL, this);
	}

	private onError(err: any): void {
		if (isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}

	public create(parent: Builder): TPromise<void> {
		super.create(parent);
		this.root = parent.getHTMLElement();
		this.serverTreeView = this._instantiationService.createInstance(ServerTreeView, this.getActionRunner(), {});
		parent.div({ class: 'server-explorer-viewlet' }, (viewletContainer) => {
			this.viewletContainer = viewletContainer;
			viewletContainer.div({ class: 'search-box' }, (searchBoxContainer) => {
				this.searchBoxContainer = searchBoxContainer;
				this.searchBox = new InputBox(
					searchBoxContainer.getHTMLElement(),
					null,
					{
						placeholder: 'Search server names',
						actions: [this.clearSearchAction]
					}
				);

				this.toDispose.push(addStandardDisposableListener(this.searchBox.inputElement, 'keydown', (e: IKeyboardEvent) => {
					const isEscape = e.equals(KeyCode.Escape);
					const isEnter = e.equals(KeyCode.Enter);
					if (isEscape || isEnter) {
						e.preventDefault();
						e.stopPropagation();
						if (isEnter) {
							this.search(this.searchBox.value);
						}
					}
				}));

			});
			viewletContainer.div({}, (splitviewContainer) => {
				this.splitView = new SplitView(splitviewContainer.getHTMLElement());
				this.splitView.addView(this.serverTreeView);
				this.serverTreeView.create().then(() => {
					this.updateTitleArea();
					this.setVisible(this.isVisible()).then(() => this.focus());
				});
				this.serverTreeView.setVisible(true);
				this.views.push(this.serverTreeView);
			});
		});
		return TPromise.as(null);
	}

	public search(value: string): void {
		if (value) {
			this.clearSearchAction.enabled = true;
			this.serverTreeView.searchTree(value);
		}
	}

	public setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.serverTreeView.setVisible(visible);
			}
		});
	}

	public focus(): void {
		this.serverTreeView.focus();
	}

	public layout({ height, width }: Dimension): void {
		this.searchBox.layout();
		this.splitView.layout(height - 36); // account for search box
		toggleClass(this.root, 'narrow', width <= 350);
	}

	public getOptimalWidth(): number {
		return 400;
	}

	public clearSearch() {
		this.serverTreeView.refreshTree();
		this.searchBox.value = '';
		this.clearSearchAction.enabled = false;
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}

}
