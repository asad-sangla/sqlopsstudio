/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/connectionViewlet';
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
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { ConnectionProfileGroup } from "../common/connectionProfileGroup";

export class ConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	private searchBox: HTMLInputElement;
	private disposables: IDisposable[] = [];
	private connectionButton: Button;
	private views: IViewletView[];
	private serverTreeView: ServerTreeView;
	private viewletContainer: Builder;
	private newConnectionContainer: Builder;
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

		this.connectionManagementService.onAddConnectionProfile(() => {
			if (this.connectionButton) {
				this.connectionButton.getElement().style.display = 'none';
			}
		});
	}

	private hasRegisteredServers(): boolean {
		return this.doHasRegisteredServers(this.connectionManagementService.getConnectionGroups());
	}

	private doHasRegisteredServers(root: ConnectionProfileGroup[]): boolean {

		if (!root || root.length === 0) {
			return false;
		}

		for (let i = 0; root.length; ++i) {
			let item = root[i];

			if (item.connections && item.connections.length > 0) {
				return true;
			}

			if (this.doHasRegisteredServers(item.children)) {
				return true;
			}
		}

		return false;
	}

	public create(parent: Builder): TPromise<void> {
		super.create(parent);
		this.root = parent.getHTMLElement();
		this.viewletContainer = parent.div().addClass('server-explorer-viewlet');
		if (!this.hasRegisteredServers()) {
			this.connectionButton = new Button(this.viewletContainer);
			this.connectionButton.label = 'Add Server';
			this.connectionButton.addListener2('click', () => {
				this.newConnection();
			});
		}

		this.splitView = new SplitView(this.viewletContainer.getHTMLElement());
		this.serverTreeView = this.instantiationService.createInstance(ServerTreeView, this.getActionRunner(), {});
		this.splitView.addView(this.serverTreeView);
		this.serverTreeView.create().then(() => {
			this.updateTitleArea();
			this.setVisible(this.isVisible()).then(() => this.focus());
		});
		this.serverTreeView.setVisible(true);
		this.views.push(this.serverTreeView);
		return TPromise.as(null);
	}

	search(value: string): void {
		//TODO
	}

	setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.serverTreeView.setVisible(visible);
			}
		});
	}

	focus(): void {
		this.serverTreeView.focus();
	}

	layout({ height, width }: Dimension): void {
		this.splitView.layout(height);
		toggleClass(this.root, 'narrow', width <= 350);
	}

	getOptimalWidth(): number {
		return 400;
	}

	private newConnection(): void {
		this.connectionManagementService.showConnectionDialog();
	}

	private onError(err: any): void {
		if (isPromiseCanceledError(err)) {
			return;
		}
		this.messageService.show(Severity.Error, err);
	}
}
