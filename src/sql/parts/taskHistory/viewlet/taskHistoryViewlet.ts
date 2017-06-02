/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!./media/taskHistoryViewlet';
import { TPromise } from 'vs/base/common/winjs.base';
import { Builder, Dimension } from 'vs/base/browser/builder';
import { Viewlet, IViewletView } from 'vs/workbench/browser/viewlet';
import { IViewletService } from 'vs/workbench/services/viewlet/browser/viewlet';
import { toggleClass } from 'vs/base/browser/dom';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IMessageService } from 'vs/platform/message/common/message';
import { isPromiseCanceledError } from 'vs/base/common/errors';
import Severity from 'vs/base/common/severity';
import { IConnectionManagementService } from 'sql/parts/connection/common/connectionManagement';
import { TaskHistoryView } from 'sql/parts/taskHistory/viewlet/taskHistoryView';
import { SplitView } from 'vs/base/browser/ui/splitview/splitview';
import { IDisposable, dispose } from 'vs/base/common/lifecycle';

export const VIEWLET_ID = 'workbench.view.taskHistory';

export class TaskHistoryViewlet extends Viewlet {

	private root: HTMLElement;
	private toDispose: IDisposable[] = [];
	private views: IViewletView[];
	private taskHistoryView: TaskHistoryView;
	private viewletContainer: Builder;
	private splitView: SplitView;

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IConnectionManagementService private connectionManagementService: IConnectionManagementService,
		@IInstantiationService private _instantiationService: IInstantiationService,
		@IViewletService private viewletService: IViewletService,
		@IMessageService private messageService: IMessageService
	) {
		super(VIEWLET_ID, telemetryService, themeService);
		this.views = [];
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
		this.taskHistoryView = this._instantiationService.createInstance(TaskHistoryView, this.getActionRunner(), {});
		parent.div({ class: 'task-history-viewlet' }, (viewletContainer) => {
			this.viewletContainer = viewletContainer;
			viewletContainer.div({}, (splitviewContainer) => {
				this.splitView = new SplitView(splitviewContainer.getHTMLElement());
				this.splitView.addView(this.taskHistoryView);
				this.taskHistoryView.create().then(() => {
					this.updateTitleArea();
					this.setVisible(this.isVisible()).then(() => this.focus());
				});
				this.taskHistoryView.setVisible(true);
				this.views.push(this.taskHistoryView);
			});
		});
		return TPromise.as(null);
	}

	public setVisible(visible: boolean): TPromise<void> {
		return super.setVisible(visible).then(() => {
			if (visible) {
				this.taskHistoryView.setVisible(visible);
			}
		});
	}

	public focus(): void {
		this.taskHistoryView.focus();
	}

	public layout({ height, width }: Dimension): void {
		this.splitView.layout(height);
		toggleClass(this.root, 'narrow', width <= 350);
	}

	public getOptimalWidth(): number {
		return 400;
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}

}
