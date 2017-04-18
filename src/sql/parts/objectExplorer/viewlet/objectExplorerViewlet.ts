/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/objectExplorerViewlet';
import { localize } from 'vs/nls';
import { ThrottledDelayer } from 'vs/base/common/async';
import { TPromise } from 'vs/base/common/winjs.base';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet, IViewletView } from 'vs/workbench/browser/viewlet';
import { append, $, addStandardDisposableListener, EventType, addClass, removeClass, toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { ObjectExplorerView } from 'sql/parts/objectExplorer/viewlet/objectExplorerView';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';

export const OBJECTEXPLORER_VIEWLET_ID = 'workbench.view.objectexplorer';

export class ObjectExplorerViewlet extends Viewlet {

	private searchDelayer: ThrottledDelayer<any>;
	private root: HTMLElement;
	// private searchBox: HTMLInputElement;
	private messageBox: HTMLElement;
	private disposables: IDisposable[] = [];
	private views: IViewletView[];
	private objectExplorerTreeView: ObjectExplorerView;
	private viewletContainer: Builder;
	private splitView: SplitView;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IMessageService private messageService: IMessageService
	) {
		super(OBJECTEXPLORER_VIEWLET_ID, telemetryService, themeService);
		this.searchDelayer = new ThrottledDelayer(500);
		this.views = [];
	}

	create(parent: Builder): TPromise<void> {
		super.create(parent);
		parent.addClass('objectExplorer-viewlet');
		this.root = parent.getHTMLElement();
		const header = append(this.root, $('.header'));

		// Todo: Will add searchbox back
		/*
		this.searchBox = append(header, $<HTMLInputElement>('input.search-box'));
		this.searchBox.placeholder = 'Find Server';
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.FOCUS, () => addClass(this.searchBox, 'synthetic-focus')));
		this.disposables.push(addStandardDisposableListener(this.searchBox, EventType.BLUR, () => removeClass(this.searchBox, 'synthetic-focus')));
		*/

		this.messageBox = append(this.root, $('.message'));

		this.viewletContainer = parent.div().addClass('object-explorer-viewlet');

		this.splitView = new SplitView(this.viewletContainer.getHTMLElement());
		this.objectExplorerTreeView = this.instantiationService.createInstance(ObjectExplorerView, this.getActionRunner(), {});
		this.splitView.addView(this.objectExplorerTreeView);
		this.views.push(this.objectExplorerTreeView);
		this.objectExplorerTreeView.create().then(() => {
			this.updateTitleArea();
			this.setVisible(this.isVisible()).then(() => this.focus());
		});
		this.objectExplorerTreeView.setVisible(true);
		return TPromise.as(null);
	}

	search(value: string): void {
		//TODO
	}

	setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.objectExplorerTreeView.setVisible(visible);
			} else {
				this.setModel([]);
			}
		});
	}

	focus(): void {
		this.objectExplorerTreeView.focus();
	}

	layout({ height, width }: Dimension): void {
		this.splitView.layout(height);
		toggleClass(this.root, 'narrow', width <= 300);
	}

	getOptimalWidth(): number {
		return 400;
	}

	private setModel(model: number[]) {
		toggleClass(this.messageBox, 'hidden', model.length > 0);

		if (model.length === 0 && this.isVisible()) {
			this.messageBox.textContent = localize('no object explorer found', "No object explorer found.");
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
