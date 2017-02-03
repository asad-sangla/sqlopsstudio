/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/serverTree';
import { localize } from 'vs/nls';
import { ThrottledDelayer, always } from 'vs/base/common/async';
import { TPromise, Promise } from 'vs/base/common/winjs.base';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet,  IViewletView } from 'vs/workbench/browser/viewlet';
import { IDataSource } from 'vs/base/parts/tree/browser/tree';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { append, $, addStandardDisposableListener, EventType, addClass, removeClass, toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError, onUnexpectedError, create as createError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { IConnectionsViewlet, IRegisteredServersService, TREEVIEWLET_ID } from 'sql/parts/connection/common/registeredServers';
import { ServerTreeView } from 'sql/parts/connection/electron-browser/serverTreeView';
import { SplitView} from 'vs/base/browser/ui/splitview/splitview';

export class TreeConnectionViewlet extends Viewlet implements IConnectionsViewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	private searchBox: HTMLInputElement;
	private extensionsBox: HTMLElement;
	private messageBox: HTMLElement;
	private disposables: IDisposable[] = [];
	private views: IViewletView[];
	private serverTreeView: ServerTreeView;
	private viewletContainer: Builder;
	private splitView: SplitView;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IRegisteredServersService private registeredServersService: IRegisteredServersService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService,
		@IMessageService private messageService: IMessageService
	) {
		super(TREEVIEWLET_ID, telemetryService);
		this.searchDelayer = new ThrottledDelayer(500);
		this.views = [];
	}

	create(parent: Builder): TPromise<void> {
		super.create(parent);
		parent.addClass('extensions-viewlet');
		this.root = parent.getHTMLElement();

		const header = append(this.root, $('.header'));

		this.searchBox = append(header, $<HTMLInputElement>('input.search-box'));
		this.searchBox.placeholder = "Find Server";
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.FOCUS, () => addClass(this.searchBox, 'synthetic-focus')));
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.BLUR, () => removeClass(this.searchBox, 'synthetic-focus')));

		this.extensionsBox = append(this.root, $('.extensions'));
		this.messageBox = append(this.root, $('.message'));


		this.viewletContainer = parent.div().addClass('server-explorer-viewlet');
		this.splitView = new SplitView(this.viewletContainer.getHTMLElement());
		this.serverTreeView = this.instantiationService.createInstance(ServerTreeView, this.getActionRunner(), {});
		this.splitView.addView(this.serverTreeView, 10);
		this.views.push(this.serverTreeView);

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
				this.searchBox.focus();
				this.searchBox.setSelectionRange(0, this.searchBox.value.length);
				this.serverTreeView.setVisible(visible);
				//this.populateServerList().then(model => {
				//	this.setModel(model);
				//});
			} else {
				this.setModel([]);
			}
		});
	}

	focus(): void {
		this.searchBox.focus();
		this.serverTreeView.focus();
	}

	layout({ height, width }: Dimension): void {
		this.splitView.layout(height);
		toggleClass(this.root, 'narrow', width <= 300);
	}

	getOptimalWidth(): number {
		return 400;
	}

	private setModel(model: number[]) {
		toggleClass(this.extensionsBox, 'hidden', model.length === 0);
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
