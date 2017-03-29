/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/extensionsViewlet';
import { localize } from 'vs/nls';
import { ThrottledDelayer } from 'vs/base/common/async';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet, IViewletView } from 'vs/workbench/browser/viewlet';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { append, $, addStandardDisposableListener, EventType, addClass, removeClass, toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { Button } from 'vs/base/browser/ui/button/button';
import { IConnectionsViewlet, IConnectionManagementService, VIEWLET_ID } from 'sql/parts/connection/common/connectionManagement';
import { ServerTreeView } from 'sql/parts/connection/viewlet/serverTreeView';
import { RecentConnectionsView } from 'sql/parts/connection/viewlet/recentConnectionsView';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';

export class ConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	private searchBox: HTMLInputElement;
	private messageBox: HTMLElement;
	private disposables: IDisposable[] = [];
	private connectionButton: Button;
	private views: IViewletView[];
	private serverTreeView: ServerTreeView;
	private recentConnView: RecentConnectionsView;
	private activeConnView: RecentConnectionsView;
	private viewletContainer: Builder;
	private splitView: SplitView;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService,
		@IMessageService private messageService: IMessageService
	) {
		super(VIEWLET_ID, telemetryService);
		this.searchDelayer = new ThrottledDelayer(500);
		this.views = [];
	}

	create(parent: Builder): TPromise<void> {
		super.create(parent);
		parent.addClass('extensions-viewlet');
		this.root = parent.getHTMLElement();
		const header = append(this.root, $('.header'));
		this.searchBox = append(header, $<HTMLInputElement>('input.search-box'));
		this.searchBox.placeholder = 'Find Server';
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.FOCUS, () => addClass(this.searchBox, 'synthetic-focus')));
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.BLUR, () => removeClass(this.searchBox, 'synthetic-focus')));

		this.messageBox = append(this.root, $('.message'));

		this.viewletContainer = parent.div().addClass('server-explorer-viewlet');

		this.connectionButton = new Button(this.viewletContainer);
		this.connectionButton.label = 'New Connection';
		this.connectionButton.addListener2('click', () => {
			this.newConnection();
		});

		this.splitView = new SplitView(this.viewletContainer.getHTMLElement());
		this.serverTreeView = this.instantiationService.createInstance(ServerTreeView, this.getActionRunner(), {});
		this.splitView.addView(this.serverTreeView, 20);
		this.views.push(this.serverTreeView);
		this.views.push(this.recentConnView);
		this.serverTreeView.create().then(() => {
			this.updateTitleArea();
			this.setVisible(this.isVisible()).then(() => this.focus());
		});
		this.serverTreeView.setVisible(true);
		return TPromise.as(null);
	}

	search(value: string): void {
		//TODO
	}

	setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.serverTreeView.setVisible(visible);
			} else {
				this.setModel([]);
			}
		});
	}

	focus(): void {
		this.serverTreeView.focus();
	}

	layout({ height, width }: Dimension): void {
		this.splitView.layout(height);
		toggleClass(this.root, 'narrow', width <= 300);
	}

	getOptimalWidth(): number {
		return 400;
	}

	private newConnection(): void {
		this.connectionManagementService.showConnectionDialog();
	}

	private setModel(model: number[]) {
		toggleClass(this.messageBox, 'hidden', model.length > 0);

		if (model.length === 0 && this.isVisible()) {
			this.messageBox.textContent = localize('no extensions found', "No extensions found.");
		} else {
			this.messageBox.textContent = '';
		}
	}

	private onError(err: any): void {
		if (isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}
}
